import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager';
import { VectorConfigSchema } from '../config/schema';
import { getDefaultEmbeddingProvider } from '../providers/embeddings';
import { indexProject } from '../vector/indexer';
import { getVectorCount } from '../vector/db';
import { logger } from '../utils/logger';
import ora from 'ora';

export function createVectorIndexCommand() {
  const command = new Command('vector-index');
  
  command
    .description('Index project files for semantic search')
    .option('-p, --provider <provider>', 'Embedding provider (openai, azure, gemini)')
    .option('-f, --force', 'Force re-indexing of all files')
    .option('--path <path>', 'Project path to index (default: current directory)', process.cwd())
    .action(async (options) => {
      const spinner = ora('Initializing vector indexing...').start();
      
      try {
        const configManager = new ConfigManager();
        const config = await configManager.getConfig();
        
        // Get embedding provider
        let provider;
        if (options.provider) {
          const { EmbeddingProvider } = await import('../providers/embeddings');
          provider = new EmbeddingProvider({ provider: options.provider }, configManager);
        } else {
          provider = await getDefaultEmbeddingProvider(configManager);
        }
        
        spinner.stop();
        
        // Get current vector count
        const currentCount = await getVectorCount(options.path);
        if (currentCount > 0 && !options.force) {
          logger.log(chalk.yellow(`Found ${currentCount} existing vectors. Use --force to re-index.`));
        }
        
        // Index the project
        const result = await indexProject({
          projectPath: options.path,
          provider,
          config: config.vectorConfig || VectorConfigSchema.parse({}),
          force: options.force,
          onProgress: (message) => {
            logger.log(chalk.dim(message));
          },
        });
        
        logger.log(chalk.green('✓ Indexing complete!'));
        logger.log(chalk.dim(`  Files indexed: ${result.filesIndexed}`));
        logger.log(chalk.dim(`  Chunks created: ${result.chunksCreated}`));
        logger.log(chalk.dim(`  Time: ${(result.timeMs / 1000).toFixed(1)}s`));
        
        const totalCount = await getVectorCount(options.path);
        logger.log(chalk.dim(`  Total vectors: ${totalCount}`));
      } catch (error) {
        spinner.stop();
        logger.error(chalk.red('Indexing failed:'), error);
        process.exit(1);
      }
    });
  
  return command;
}