import { ProviderManager } from '../../providers/manager';
import { AIProvider } from '../../providers/types';
import { MockAIProvider } from './ai-provider';
import { MockConfigManager } from './config-manager';

export class MockProviderManager extends ProviderManager {
  private mockProviders: Map<string, AIProvider> = new Map();
  private configuredProviders: string[] = [];

  constructor() {
    const mockConfigManager = new MockConfigManager();
    super(mockConfigManager);
  }

  async getProvider(name: string): Promise<AIProvider> {
    const provider = this.mockProviders.get(name);
    if (!provider) {
      // Special case: if OpenAI is requested but not configured, fallback to Azure if available
      if (name === "openai" && this.configuredProviders.includes("azure")) {
        return this.mockProviders.get("azure")!;
      }
      throw new Error(`Provider "${name}" is not configured. Available configured providers: ${this.configuredProviders.join(", ")}. Run 'ultra-mcp config' to set up API keys.`);
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