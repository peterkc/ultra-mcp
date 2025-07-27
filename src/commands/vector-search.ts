import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { getDefaultEmbeddingProvider } from '../providers/embeddings';
import { searchVectors, getRelatedFiles } from '../vector/search';
import { getVectorCount } from '../vector/db';
import { logger } from '../utils/logger';
import { join } from 'path';

export function createVectorSearchCommand() {
  const command = new Command('vector-search');
  
  command
    .description('Search for files using natural language queries')
    .argument('<query>', 'Natural language search query')
    .option('-p, --provider <provider>', 'Embedding provider (openai, azure, gemini)')
    .option('-l, --limit <number>', 'Maximum number of results', '10')
    .option('-t, --threshold <number>', 'Similarity threshold (0-1)', '0.7')
    .option('--files-only', 'Show only file paths without chunks')
    .option('--path <path>', 'Project path to search (default: current directory)', process.cwd())
    .action(async (query: string, options) => {
      try {
        const configManager = new ConfigManager();
        
        // Check if project is indexed
        const vectorCount = await getVectorCount(options.path);
        if (vectorCount === 0) {
          logger.error(chalk.red('No vectors found. Please run "ultra vector-index" first.'));
          process.exit(1);
        }
        
        // Get embedding provider
        let provider;
        if (options.provider) {
          const { EmbeddingProvider } = await import('../providers/embeddings');
          provider = new EmbeddingProvider({ provider: options.provider }, configManager);
        } else {
          provider = await getDefaultEmbeddingProvider(configManager);
        }
        
        logger.log(chalk.dim(`Searching ${vectorCount} vectors...`));
        
        if (options.filesOnly) {
          // Get related files only
          const files = await getRelatedFiles({
            projectPath: options.path,
            query,
            provider,
            limit: parseInt(options.limit, 10),
            similarityThreshold: parseFloat(options.threshold),
          });
          
          if (files.length === 0) {
            logger.log(chalk.yellow('No matching files found.'));
            return;
          }
          
          logger.log(chalk.green(`Found ${files.length} related files:\n`));
          files.forEach(file => {
            logger.log(chalk.cyan(join(options.path, file)));
          });
        } else {
          // Get full search results with chunks
          const results = await searchVectors({
            projectPath: options.path,
            query,
            provider,
            limit: parseInt(options.limit, 10),
            similarityThreshold: parseFloat(options.threshold),
          });
          
          if (results.length === 0) {
            logger.log(chalk.yellow('No matching results found.'));
            return;
          }
          
          logger.log(chalk.green(`Found ${results.length} matches:\n`));
          
          results.forEach((result, index) => {
            logger.log(chalk.cyan(`${index + 1}. ${result.relpath}`));
            logger.log(chalk.dim(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`));
            logger.log(chalk.dim(`   Chunk ID: ${result.chunkId}`));
            
            // Show a preview of the chunk (first 200 chars)
            const preview = result.chunk.slice(0, 200).replace(/\n/g, ' ');
            logger.log(chalk.gray(`   Preview: ${preview}${result.chunk.length > 200 ? '...' : ''}`));
            logger.log('');
          });
        }
      } catch (error) {
        logger.error(chalk.red('Search failed:'), error);
        process.exit(1);
      }
    });
  
  return command;
}