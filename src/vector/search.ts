import { getVectorDB, bufferToFloat32Array } from './db';
import { EmbeddingProvider } from '../providers/embeddings';
import { logger } from '../utils/logger';

export interface SearchOptions {
  projectPath: string;
  query: string;
  provider: EmbeddingProvider;
  limit?: number;
  similarityThreshold?: number;
}

export interface SearchResult {
  relpath: string;
  chunk: string;
  similarity: number;
  chunkId: string;
}

export async function searchVectors(options: SearchOptions): Promise<SearchResult[]> {
  const { projectPath, query, provider, limit = 10, similarityThreshold = 0.7 } = options;
  
  // Get query embedding
  const queryEmbedding = await provider.getEmbedding(query);
  
  // Get database
  const { client } = await getVectorDB(projectPath);
  
  try {
    // Try to use native vector search if available
    let results: Array<{
      id: string;
      relpath: string;
      chunk: string;
      embedding: Buffer;
      distance: number;
    }>;

    try {
      const vectorResult = await client.execute({
        sql: `SELECT vc.id, vc.relpath, vc.chunk, vc.embedding, vt.distance
              FROM vector_top_k('vec_idx', vector(?), ?) vt
              JOIN vector_chunks vc ON vc.id = vt.id
              ORDER BY vt.distance`,
        args: [JSON.stringify(queryEmbedding), limit]
      });

      results = vectorResult.rows.map(row => ({
        id: row[0] as string,
        relpath: row[1] as string,
        chunk: row[2] as string,
        embedding: row[3] as Buffer,
        distance: row[4] as number,
      }));
    } catch (error) {
      // Fallback to manual cosine similarity if vector extension not available
      logger.warn('Native vector search failed, using fallback:', error);
      
      const fallbackResult = await client.execute({
        sql: 'SELECT id, relpath, chunk, embedding FROM vector_chunks',
        args: []
      });

      const allChunks = fallbackResult.rows.map(row => ({
        id: row[0] as string,
        relpath: row[1] as string,
        chunk: row[2] as string,
        embedding: row[3] as Buffer,
      }));
      
      // Calculate cosine similarity for each chunk
      const withSimilarity = allChunks.map(chunk => {
        const chunkEmbedding = bufferToFloat32Array(chunk.embedding);
        const similarity = cosineSimilarity(queryEmbedding, Array.from(chunkEmbedding));
        return {
          ...chunk,
          distance: 1 - similarity, // Convert similarity to distance
        };
      });
      
      // Sort by similarity and limit
      results = withSimilarity
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
    }
    
    // Convert distance to similarity and filter by threshold
    return results
      .map(result => ({
        relpath: result.relpath,
        chunk: result.chunk,
        similarity: 1 - result.distance,
        chunkId: result.id,
      }))
      .filter(result => result.similarity >= similarityThreshold);
  } catch (error) {
    throw new Error(`Vector search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getRelatedFiles(options: SearchOptions): Promise<string[]> {
  const results = await searchVectors(options);
  
  // Get unique file paths
  const filePaths = new Set<string>();
  for (const result of results) {
    filePaths.add(result.relpath);
  }
  
  return Array.from(filePaths);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}