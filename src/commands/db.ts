import { spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import { ConfigManager } from '../config/manager';
import { getUsageStats } from '../db/tracking';
import { cyan, green, gray, yellow, bold } from 'colorette';

export async function runDbShow(): Promise<void> {
  const configManager = new ConfigManager();
  const dbPath = configManager.getDatabasePath();
  
  console.log(cyan('Database location:'));
  console.log(dbPath);
  
  // Check if file exists and show size
  if (existsSync(dbPath)) {
    const stats = statSync(dbPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    if (stats.size > 1024 * 1024) {
      console.log(gray(`Size: ${sizeMB} MB`));
    } else {
      console.log(gray(`Size: ${sizeKB} KB`));
    }
    
    console.log(gray(`Last modified: ${stats.mtime.toLocaleString()}`));
  } else {
    console.log(gray('(Database not yet created)'));
  }
}

export async function runDbView(): Promise<void> {
  const configManager = new ConfigManager();
  const dbPath = configManager.getDatabasePath();
  
  console.log(cyan('Starting Drizzle Studio...'));
  console.log(gray('Press Ctrl+C to stop the studio'));
  
  const child = spawn('npx', ['drizzle-kit', 'studio'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: `file:${dbPath}`,
    },
  });
  
  // Handle process lifecycle
  child.on('error', (error) => {
    console.error('Failed to start Drizzle Studio:', error.message);
    console.log(yellow('\nMake sure drizzle-kit is installed:'));
    console.log(cyan('  npm install drizzle-kit'));
  });
  
  child.on('exit', (code) => {
    if (code !== 0) {
      console.log(yellow('\nDrizzle Studio exited with code'), code);
    }
  });
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\nShutting down Drizzle Studio...');
    child.kill();
    process.exit(0);
  });
}

export async function runDbStats(): Promise<void> {
  console.log(bold(cyan('Usage Statistics\n')));
  
  try {
    const stats = await getUsageStats(30);
    
    if (!stats) {
      console.log(yellow('No usage data available or database not accessible.'));
      return;
    }
    
    console.log(bold('Last 30 days:'));
    console.log(`  Total requests: ${bold(green(stats.totalRequests.toString()))}`);
    console.log(`  Total tokens: ${bold(green(stats.totalTokens.toLocaleString()))}`);
    console.log(`  Estimated cost: ${bold(green('$' + stats.totalCost.toFixed(4)))}`);
    
    console.log(bold('\nBy provider:'));
    Object.entries(stats.byProvider).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${green(count.toString())} requests`);
    });
    
    if (stats.totalRequests === 0) {
      console.log(gray('\nNo requests tracked yet. Usage tracking will begin automatically.'));
    }
    
  } catch (error) {
    console.error('Failed to get usage statistics:', error instanceof Error ? error.message : String(error));
    console.log(yellow('\nTry running the doctor command to check database health:'));
    console.log(cyan('  npx ultra doctor'));
  }
}