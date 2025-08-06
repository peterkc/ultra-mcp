export { MockConfigManager } from './config-manager';
export { MockAIProvider } from './ai-provider';
export { MockProviderManager } from './provider-manager';

import { MockConfigManager } from './config-manager';
import { MockProviderManager } from './provider-manager';
import type { Config } from '../../config/manager';

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
  context.providerManager.addMockProvider('grok');

  // Set up default config
  context.configManager.setMockConfig({
    openai: { apiKey: 'mock-openai-key', baseURL: undefined },
    google: { apiKey: 'mock-google-key', baseURL: undefined },
    azure: {
      apiKey: 'mock-azure-key',
      resourceName: 'mock-resource',
    },
    xai: { apiKey: 'mock-xai-key', baseURL: undefined },
  });
}