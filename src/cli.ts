#!/usr/bin/env node

import { program } from 'commander';
import { runInteractiveConfig } from './config/interactive.js';
import { startServer } from './start-server.js';

program
  .name('ultra-mcp')
  .description('Ultra MCP - Model Context Protocol server for OpenAI and Gemini')
  .version('1.0.0');

program
  .command('config')
  .description('Configure API keys and settings')
  .action(async () => {
    try {
      await runInteractiveConfig();
      process.exit(0);
    } catch (error) {
      console.error('Configuration error:', error);
      process.exit(1);
    }
  });

// Default command (when no subcommand is provided)
program
  .action(async () => {
    try {
      await startServer();
    } catch (error) {
      console.error('Server error:', error);
      process.exit(1);
    }
  });

program.parse();