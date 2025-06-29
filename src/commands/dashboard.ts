import { startDashboardServer } from '../api/server';
import { getConfigManager } from '../config/manager';
import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

interface DashboardOptions {
  port: number;
  dev: boolean;
}

export async function runDashboard(options: DashboardOptions): Promise<void> {
  console.log(chalk.blue('🚀 Ultra MCP Dashboard\n'));

  // Check if API keys are configured
  const configManager = await getConfigManager();
  const config = await configManager.getConfig();
  
  if (!config.openai?.apiKey && !config.google?.apiKey && !config.azure?.apiKey) {
    console.log(chalk.yellow('⚠️  No API keys configured'));
    console.log(chalk.gray('Run "ultra-mcp config" to set up API keys\n'));
  }

  if (options.dev) {
    // Development mode - start Vite dev server
    console.log(chalk.cyan('Starting in development mode...\n'));
    
    const webDir = path.join(process.cwd(), 'web');
    
    if (!existsSync(webDir)) {
      console.error(chalk.red('Error: web directory not found'));
      console.log(chalk.gray('Make sure you are in the project root directory'));
      process.exit(1);
    }
    
    // Start backend server
    startDashboardServer(options.port);
    
    // Start Vite dev server
    console.log(chalk.cyan('\nStarting Vite development server...'));
    const viteProcess = spawn('npm', ['run', 'dev'], {
      cwd: webDir,
      stdio: 'inherit',
      shell: true,
    });
    
    viteProcess.on('error', (error) => {
      console.error(chalk.red('Failed to start Vite dev server:'), error);
      process.exit(1);
    });
    
    process.on('SIGINT', () => {
      viteProcess.kill();
      process.exit(0);
    });
    
  } else {
    // Production mode - serve built files
    // Find the package root directory (where dist-web/ folder is located)
    const packageRoot = path.join(__dirname, '..', '..');
    const distWebPath = path.join(packageRoot, 'dist-web');
    
    if (!existsSync(distWebPath)) {
      console.log(chalk.yellow('⚠️  Built dashboard not found'));
      console.log(chalk.gray('Run "npm run build:dashboard" to build the dashboard\n'));
      console.log(chalk.cyan('Starting API server only...\n'));
    } else {
      console.log(chalk.green('✓ Serving built dashboard'));
    }
    
    startDashboardServer(options.port);
    
    console.log(chalk.green(`\n✨ Dashboard running at http://localhost:${options.port}`));
    console.log(chalk.gray('\nPress Ctrl+C to stop\n'));
  }
}