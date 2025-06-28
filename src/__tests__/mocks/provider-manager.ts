import { ProviderManager } from '../../providers/manager.js';
import { AIProvider } from '../../providers/types.js';
import { MockAIProvider } from './ai-provider.js';
import { MockConfigManager } from './config-manager.js';

export class MockProviderManager extends ProviderManager {
  private mockProviders: Map<string, AIProvider> = new Map();
  private configuredProviders: string[] = [];

  constructor() {
    const mockConfigManager = new MockConfigManager();
    super(mockConfigManager);
  }

  getProvider(name: string): AIProvider {
    const provider = this.mockProviders.get(name);
    if (!provider) {
      throw new Error(`Provider "${name}" is not configured.`);
    }
    return provider;
  }

  async getConfiguredProviders(): Promise<string[]> {
    return Promise.resolve(this.configuredProviders);
  }

  // Mock helper methods
  addMockProvider(name: string, provider?: AIProvider): void {
    const mockProvider = provider || new MockAIProvider(name);
    this.mockProviders.set(name, mockProvider);
    if (!this.configuredProviders.includes(name)) {
      this.configuredProviders.push(name);
    }
  }

  removeMockProvider(name: string): void {
    this.mockProviders.delete(name);
    this.configuredProviders = this.configuredProviders.filter(p => p !== name);
  }

  setConfiguredProviders(providers: string[]): void {
    this.configuredProviders = providers;
    // Ensure mock providers exist for all configured providers
    for (const provider of providers) {
      if (!this.mockProviders.has(provider)) {
        this.addMockProvider(provider);
      }
    }
  }

  reset(): void {
    this.mockProviders.clear();
    this.configuredProviders = [];
  }

  getMockProvider(name: string): MockAIProvider | undefined {
    const provider = this.mockProviders.get(name);
    return provider instanceof MockAIProvider ? provider : undefined;
  }
}