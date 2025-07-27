import { spawn } from 'child_process';
import { ConfigManager } from '../config/manager';
import { bold, green, yellow, red, blue, cyan } from 'colorette';
import * as readline from 'readline';
import { platform } from 'os';
import { showApiKeyGuide } from '../utils/api-key-guide';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function checkClaudeCodeInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version'], { 
      stdio: 'pipe',
      shell: true 
    });
    
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
}

async function runClaudeCommand(args: string[]): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    let output = '';
    const child = spawn('claude', args, { 
      stdio: 'pipe',
      shell: true 
    });
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('error', (error) => {
      resolve({ success: false, output: error.message });
    });
    
    child.on('exit', (code) => {
      resolve({ success: code === 0, output });
    });
  });
}

export async function runInstall(): Promise<void> {
  console.log(bold(blue('\n🚀 Ultra MCP Installation for Claude Code\n')));
  
  // Check if Claude Code is installed
  console.log('Checking Claude Code installation...');
  const claudeInstalled = await checkClaudeCodeInstalled();
  
  if (!claudeInstalled) {
    console.log(red('❌ Claude Code CLI not found'));
    console.log(yellow('\nPlease install Claude Code first:'));
    console.log(cyan('  1. Visit https://claude.ai/code'));
    console.log(cyan('  2. Download and install Claude Code'));
    console.log(cyan('  3. Run this command again\n'));
    
    console.log(yellow('Alternatively, you can manually configure Ultra MCP:'));
    showManualInstructions();
    rl.close();
    return;
  }
  
  console.log(green('✓ Claude Code CLI found'));
  
  // Check if API keys are configured
  const configManager = new ConfigManager();
  const config = await configManager.getConfig();
  const hasKeys = config.openai?.apiKey || config.google?.apiKey || config.azure?.apiKey || config.xai?.apiKey;
  
  if (!hasKeys) {
    console.log(yellow('\n⚠️  No API keys configured'));
    console.log('Run ' + cyan('npx -y ultra-mcp config') + ' to configure API keys first\n');
    
    const proceed = await question('Do you want to continue with installation anyway? (y/N) ');
    if (proceed.toLowerCase() !== 'y') {
      rl.close();
      return;
    }
  }
  
  // Ask for installation scope
  console.log('\nSelect installation scope:');
  console.log('  1. User (available across all projects)');
  console.log('  2. Project (current project only)');
  const scopeChoice = await question('\nEnter choice (1-2) [1]: ') || '1';
  
  const scope = scopeChoice === '2' ? 'project' : 'user';
  
  // Build the claude mcp add command
  console.log('\n' + cyan('Installing Ultra MCP...'));
  
  const args = [
    'mcp',
    'add',
    'ultra-mcp',
    '-s',
    scope,
    '--',
    'npx',
    '-y',
    'ultra-mcp@latest'
  ];
  
  const result = await runClaudeCommand(args);
  
  if (result.success) {
    console.log(green('\n✅ Ultra MCP installed successfully!'));
    console.log('\nNext steps:');
    console.log('  1. Restart Claude Code');
    console.log('  2. Use ' + cyan('/mcp') + ' command in Claude Code to verify connection');
    console.log('  3. Ultra MCP tools are now available!\n');
    
    if (!hasKeys) {
      console.log(yellow('⚠️  No API keys configured yet!'));
      console.log('Ultra MCP needs API keys to work properly.');
      showApiKeyGuide();
    }
  } else {
    console.log(red('\n❌ Installation failed'));
    console.log('Error:', result.output);
    console.log('\nYou can try manual installation instead:');
    showManualInstructions();
  }
  
  rl.close();
}

function showManualInstructions(): void {
  const configPath = getConfigPath();
  
  console.log(bold('\n📝 Manual Installation Instructions:\n'));
  console.log('1. Open Claude Code configuration file:');
  console.log(cyan(`   ${configPath}`));
  
  console.log('\n2. Add Ultra MCP to the "mcpServers" section:');
  console.log(cyan(`
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "npx",
      "args": ["-y", "ultra-mcp@latest"]
    }
  }
}
`));
  
  console.log('3. Save the file and restart Claude Code\n');
  
  console.log(yellow('For more help, visit:'));
  console.log(cyan('  https://docs.anthropic.com/en/docs/claude-code/mcp\n'));
}

function getConfigPath(): string {
  switch (platform()) {
    case 'darwin':
      return '~/Library/Application Support/Claude/claude.json';
    case 'win32':
      return '%APPDATA%\\Claude\\claude.json';
    default:
      return '~/.claude.json';
  }
}