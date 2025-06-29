#!/usr/bin/env node

import { program } from 'commander';
import { runInteractiveConfig } from './config/interactive';
import { startServer } from './start-server';
import { runDoctor } from './commands/doctor';
import { runChat } from './commands/chat';
import { runInstall } from './commands/install';
import { runDbShow, runDbView, runDbStats } from './commands/db';
import { showQuickApiKeyGuide } from './utils/api-key-guide';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from package.json
let version = '0.1.0'; // fallback
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  version = packageJson.version;
} catch {
  // Use fallback version
}

program
  .name('ultra-mcp')
  .description('Ultra MCP - Model Context Protocol server for OpenAI and Gemini')
  .version(version)
  .addHelpText('after', '\nGetting Started:\n  1. Install for Claude Code: npx -y ultra install\n  2. Configure API keys: npx -y ultra config\n  3. Check health: npx -y ultra doctor')
  .on('--help', () => {
    showQuickApiKeyGuide();
  });

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

program
  .command('doctor')
  .description('Check installation and configuration health')
  .option('--test', 'Test connections to configured providers')
  .action(async (options) => {
    try {
      await runDoctor(options);
    } catch (error) {
      console.error('Doctor error:', error);
      process.exit(1);
    }
  });

program
  .command('chat')
  .description('Interactive chat with AI models')
  .option('-m, --model <model>', 'Model to use for chat')
  .option('-p, --provider <provider>', 'Provider to use (openai, gemini, azure)')
  .action(async (options) => {
    try {
      await runChat(options);
    } catch (error) {
      console.error('Chat error:', error);
      process.exit(1);
    }
  });

program
  .command('install')
  .description('Install Ultra MCP for Claude Code')
  .action(async () => {
    try {
      await runInstall();
    } catch (error) {
      console.error('Install error:', error);
      process.exit(1);
    }
  });

program
  .command('db:show')
  .description('Show database file path and info')
  .action(async () => {
    try {
      await runDbShow();
    } catch (error) {
      console.error('Database show error:', error);
      process.exit(1);
    }
  });

program
  .command('db:view')
  .description('Launch Drizzle Studio to view database')
  .action(async () => {
    try {
      await runDbView();
    } catch (error) {
      console.error('Database view error:', error);
      process.exit(1);
    }
  });

program
  .command('db:stats')
  .description('Show usage statistics')
  .action(async () => {
    try {
      await runDbStats();
    } catch (error) {
      console.error('Database stats error:', error);
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