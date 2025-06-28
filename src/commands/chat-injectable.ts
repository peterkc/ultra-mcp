import chalk from 'chalk';
import * as readline from 'readline';
import { ConfigManager } from '../config/manager.js';
import { ProviderManager } from '../providers/manager.js';
import { AIProvider, AIRequest } from '../providers/types.js';

interface ChatOptions {
  model?: string;
  provider?: string;
}

interface ChatDependencies {
  configManager?: ConfigManager;
  providerManager?: ProviderManager;
  // For testing: allow overriding console and process
  console?: Console;
  process?: NodeJS.Process;
  createReadlineInterface?: typeof readline.createInterface;
}

export async function runChatWithDeps(
  options: ChatOptions = {},
  deps: ChatDependencies = {}
): Promise<void> {
  const {
    configManager = new ConfigManager(),
    providerManager = new ProviderManager(configManager),
    console: customConsole = console,
    process: customProcess = process,
    createReadlineInterface = readline.createInterface,
  } = deps;

  customConsole.log(chalk.bold('\n💬 Ultra MCP Chat\n'));
  
  // Check if any providers are configured
  const configuredProviders = await providerManager.getConfiguredProviders();
  if (configuredProviders.length === 0) {
    customConsole.error(chalk.red('❌ No AI providers configured!'));
    customConsole.error(chalk.dim('\nPlease run "npx ultra-mcp config" to set up API keys.'));
    customProcess.exit(1);
  }

  // Determine provider and model
  let selectedProvider: string;
  let selectedModel: string;
  let provider: AIProvider;

  try {
    if (options.provider) {
      // User specified provider
      if (!configuredProviders.includes(options.provider)) {
        customConsole.error(chalk.red(`❌ Provider "${options.provider}" is not configured.`));
        customConsole.error(chalk.dim(`Available providers: ${configuredProviders.join(', ')}`));
        customProcess.exit(1);
      }
      selectedProvider = options.provider;
    } else {
      // Use first configured provider
      selectedProvider = configuredProviders[0];
    }

    provider = providerManager.getProvider(selectedProvider);
    
    // Determine model
    if (options.model) {
      selectedModel = options.model;
    } else {
      selectedModel = provider.getDefaultModel();
    }

    // Display chat info
    customConsole.log(chalk.green(`Provider: ${selectedProvider}`));
    customConsole.log(chalk.green(`Model: ${selectedModel}`));
    customConsole.log(chalk.dim('\nType your message and press Enter. Type "exit" or press Ctrl+C to quit.\n'));

  } catch (error) {
    customConsole.error(chalk.red('❌ Error initializing provider:'), error);
    customProcess.exit(1);
    return; // TypeScript needs this to know execution ends here
  }

  // Set up readline interface
  const rl = createReadlineInterface({
    input: customProcess.stdin,
    output: customProcess.stdout,
    prompt: chalk.blue('You> '),
  });

  // Handle Ctrl+C
  rl.on('SIGINT', () => {
    customConsole.log(chalk.dim('\n\nGoodbye! 👋'));
    customProcess.exit(0);
  });

  // Chat loop
  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();
    
    if (input.toLowerCase() === 'exit') {
      customConsole.log(chalk.dim('\nGoodbye! 👋'));
      rl.close();
      customProcess.exit(0);
    }

    if (input === '') {
      rl.prompt();
      continue;
    }

    try {
      customConsole.log(chalk.green('\nAI> '));
      
      // Check if provider supports streaming
      if (provider.streamText) {
        // Stream the response
        const stream = provider.streamText({
          prompt: input,
          model: selectedModel,
          temperature: 0.7,
        } as AIRequest);

        for await (const chunk of stream) {
          customProcess.stdout.write(chunk);
        }
        customConsole.log('\n');
      } else {
        // Non-streaming response
        const response = await provider.generateText({
          prompt: input,
          model: selectedModel,
          temperature: 0.7,
        } as AIRequest);
        customConsole.log(response.text);
      }

      // Show usage if available
      if (provider.generateText) {
        const response = await provider.generateText({
          prompt: input,
          model: selectedModel,
          temperature: 0.7,
        } as AIRequest);
        
        if (response.usage) {
          customConsole.log(chalk.dim(`\n[Tokens: ${response.usage.totalTokens} | Model: ${response.model}]`));
        }
      }

    } catch (error) {
      customConsole.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
    }

    customConsole.log(''); // Empty line for spacing
    rl.prompt();
  }
}

// Maintain backward compatibility
export async function runChat(options: ChatOptions = {}): Promise<void> {
  return runChatWithDeps(options);
}