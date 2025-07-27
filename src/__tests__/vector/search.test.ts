import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchVectors, getRelatedFiles } from '../../vector/search';
import { getVectorDB } from '../../vector/db';
import { EmbeddingProvider } from '../../providers/embeddings';

vi.mock('../../vector/db', () => ({
  getVectorDB: vi.fn(),
  bufferToFloat32Array: vi.fn((buffer: Buffer) => {
    // Simulate proper buffer to float32 conversion
    const array = new Float32Array(buffer.length / 4);
    for (let i = 0; i < array.length; i++) {
      array[i] = buffer.readFloatLE(i * 4);
    }
    return array;
  }),
}));

vi.mock('../../providers/embeddings');

describe('searchVectors', () => {
  let mockDb: any;
  let mockClient: any;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDb = {
      all: vi.fn(),
    };
    
    mockClient = {
      execute: vi.fn(),
    };
    
    (getVectorDB as any).mockResolvedValue({ db: mockDb, client: mockClient });
    
    mockProvider = {
      getEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    };
  });

  it('should search vectors with native vector search', async () => {
    const mockResults = [
      {
        id: 'file1.ts#0',
        relpath: 'file1.ts',
        chunk: 'const test = 123;',
        embedding: Buffer.from(new Float32Array([0.1, 0.2, 0.3])),
        distance: 0.1,
      },
      {
        id: 'file2.ts#0',
        relpath: 'file2.ts',
        chunk: 'function hello() {}',
        embedding: Buffer.from(new Float32Array([0.4, 0.5, 0.6])),
        distance: 0.2,
      },
    ];
    
    // Mock successful vector search
    mockClient.execute.mockResolvedValue({
      rows: mockResults.map(r => [r.id, r.relpath, r.chunk, r.embedding, r.distance]),
      columns: ['id', 'relpath', 'chunk', 'embedding', 'distance'],
      columnTypes: ['TEXT', 'TEXT', 'TEXT', 'BLOB', 'REAL']
    });

    const results = await searchVectors({
      projectPath: '/test/project',
      query: 'test query',
      provider: mockProvider,
      limit: 10,
      similarityThreshold: 0.7,
    });

    expect(mockProvider.getEmbedding).toHaveBeenCalledWith('test query');
    expect(mockClient.execute).toHaveBeenCalledWith({
      sql: expect.stringContaining('vector_top_k'),
      args: [JSON.stringify([0.1, 0.2, 0.3]), 10]
    });
    
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      relpath: 'file1.ts',
      chunk: 'const test = 123;',
      similarity: 0.9,
      chunkId: 'file1.ts#0',
    });
  });

  it('should fall back to cosine similarity on vector search error', async () => {
    // Create a normalized vector for the query embedding
    const queryEmbedding = [0.577, 0.577, 0.577]; // normalized vector
    mockProvider.getEmbedding.mockResolvedValue(queryEmbedding);
    
    // First call fails (native vector search)
    // Second call succeeds (fallback query) with same normalized vector for high similarity
    const embeddingArray = new Float32Array(queryEmbedding);
    const embeddingBuffer = Buffer.from(embeddingArray.buffer);
    
    mockClient.execute
      .mockRejectedValueOnce(new Error('Vector extension not available'))
      .mockResolvedValueOnce({
        rows: [[
          'file1.ts#0',
          'file1.ts',
          'const test = 123;',
          embeddingBuffer,
        ]],
        columns: ['id', 'relpath', 'chunk', 'embedding'],
        columnTypes: ['TEXT', 'TEXT', 'TEXT', 'BLOB']
      });

    const results = await searchVectors({
      projectPath: '/test/project',
      query: 'test query',
      provider: mockProvider,
      limit: 10,
      similarityThreshold: 0.7,
    });

    expect(mockClient.execute).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(1);
  });

  it('should filter results by similarity threshold', async () => {
    const mockResults = [
      {
        id: 'file1.ts#0',
        relpath: 'file1.ts',
        chunk: 'high similarity',
        embedding: Buffer.from(new Float32Array([0.1, 0.2, 0.3])),
        distance: 0.1, // similarity = 0.9
      },
      {
        id: 'file2.ts#0',
        relpath: 'file2.ts',
        chunk: 'low similarity',
        embedding: Buffer.from(new Float32Array([0.4, 0.5, 0.6])),
        distance: 0.4, // similarity = 0.6
      },
    ];
    
    // Mock successful vector search
    mockClient.execute.mockResolvedValue({
      rows: mockResults.map(r => [r.id, r.relpath, r.chunk, r.embedding, r.distance]),
      columns: ['id', 'relpath', 'chunk', 'embedding', 'distance'],
      columnTypes: ['TEXT', 'TEXT', 'TEXT', 'BLOB', 'REAL']
    });

    const results = await searchVectors({
      projectPath: '/test/project',
      query: 'test',
      provider: mockProvider,
      limit: 10,
      similarityThreshold: 0.7,
    });

    expect(results).toHaveLength(1);
    expect(results[0].relpath).toBe('file1.ts');
  });
});

describe('getRelatedFiles', () => {
  let mockDb: any;
  let mockClient: any;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDb = {
      all: vi.fn(),
    };
    
    mockClient = {
      execute: vi.fn(),
    };
    
    (getVectorDB as any).mockResolvedValue({ db: mockDb, client: mockClient });
    
    mockProvider = {
      getEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    };
  });

  it('should return unique file paths', async () => {
    const mockResults = [
      {
        id: 'file1.ts#0',
        relpath: 'file1.ts',
        chunk: 'chunk1',
        embedding: Buffer.from(new Float32Array([0.1, 0.2, 0.3])),
        distance: 0.1,
      },
      {
        id: 'file1.ts#1',
        relpath: 'file1.ts',
        chunk: 'chunk2',
        embedding: Buffer.from(new Float32Array([0.1, 0.2, 0.3])),
        distance: 0.15,
      },
      {
        id: 'file2.ts#0',
        relpath: 'file2.ts',
        chunk: 'chunk3',
        embedding: Buffer.from(new Float32Array([0.4, 0.5, 0.6])),
        distance: 0.2,
      },
    ];
    
    // Mock successful vector search
    mockClient.execute.mockResolvedValue({
      rows: mockResults.map(r => [r.id, r.relpath, r.chunk, r.embedding, r.distance]),
      columns: ['id', 'relpath', 'chunk', 'embedding', 'distance'],
      columnTypes: ['TEXT', 'TEXT', 'TEXT', 'BLOB', 'REAL']
    });

    const files = await getRelatedFiles({
      projectPath: '/test/project',
      query: 'test',
      provider: mockProvider,
    });

    expect(files).toEqual(['file1.ts', 'file2.ts']);
  });

  it('should return empty array when no results found', async () => {
    mockClient.execute.mockResolvedValue({
      rows: [],
      columns: ['id', 'relpath', 'chunk', 'embedding', 'distance'],
      columnTypes: ['TEXT', 'TEXT', 'TEXT', 'BLOB', 'REAL']
    });

    const files = await getRelatedFiles({
      projectPath: '/test/project',
      query: 'test',
      provider: mockProvider,
    });

    expect(files).toEqual([]);
  });
});