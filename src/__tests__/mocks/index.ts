export { MockConfigManager } from './config-manager.js';
export { MockAIProvider } from './ai-provider.js';
export { MockProviderManager } from './provider-manager.js';

import { MockConfigManager } from './config-manager.js';
import { MockProviderManager } from './provider-manager.js';
import type { Config } from '../../config/manager.js';

export interface MockContext {
  configManager: MockConfigManager;
  providerManager: MockProviderManager;
}

export function createMockContext(config?: Partial<Config>): MockContext {
  const configManager = new MockConfigManager(config);
  const providerManager = new MockProviderManager();
  
  return {
    configManager,
    providerManager,
  };
}

export function setupDefaultMocks(context: MockContext): void {
  // Set up default providers
  context.providerManager.addMockProvider('openai');
  context.providerManager.addMockProvider('gemini');
  context.providerManager.addMockProvider('azure');
  
  // Set up default config
  context.configManager.setMockConfig({
    openai: { apiKey: 'mock-openai-key' },
    google: { apiKey: 'mock-google-key' },
    azure: { 
      apiKey: 'mock-azure-key',
      endpoint: 'https://mock.openai.azure.com/',
    },
  });
}