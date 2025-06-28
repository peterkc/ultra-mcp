import { ConfigSchema, Config, defaultConfig } from './schema.js';

export class ConfigManager {
  private store: any;
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.init();
  }

  private async init(): Promise<void> {
    const Conf = (await import('conf')).default;
    this.store = new Conf({
      projectName: 'ultra-mcp',
      schema: ConfigSchema as any, // Conf doesn't fully support zod schemas
      defaults: defaultConfig,
    });
  }

  private async ensureInitialized(): Promise<void> {
    await this.initialized;
  }

  // Get the entire configuration
  async getConfig(): Promise<Config> {
    await this.ensureInitialized();
    const rawConfig = this.store.store;
    const result = ConfigSchema.safeParse(rawConfig);
    
    if (!result.success) {
      console.error('Invalid configuration found, resetting to defaults');
      await this.reset();
      return defaultConfig;
    }
    
    return result.data;
  }

  // Set a specific API key
  async setApiKey(provider: 'openai' | 'google' | 'azure', apiKey: string | undefined): Promise<void> {
    await this.ensureInitialized();
    if (!apiKey) {
      this.store.delete(`${provider}.apiKey`);
    } else {
      this.store.set(`${provider}.apiKey`, apiKey);
    }
  }

  // Get a specific API key
  async getApiKey(provider: 'openai' | 'google' | 'azure'): Promise<string | undefined> {
    await this.ensureInitialized();
    return this.store.get(`${provider}.apiKey`);
  }

  // Set Azure endpoint
  async setAzureEndpoint(endpoint: string | undefined): Promise<void> {
    await this.ensureInitialized();
    if (!endpoint) {
      this.store.delete('azure.endpoint');
    } else {
      this.store.set('azure.endpoint', endpoint);
    }
  }

  // Check if any API keys are configured
  async hasAnyApiKeys(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(
      config.openai?.apiKey ||
      config.google?.apiKey ||
      config.azure?.apiKey
    );
  }

  // Get the path to the config file
  async getConfigPath(): Promise<string> {
    await this.ensureInitialized();
    return this.store.path;
  }

  // Reset configuration to defaults
  async reset(): Promise<void> {
    await this.ensureInitialized();
    this.store.clear();
  }

  // Validate the current configuration
  async validate(): Promise<{ valid: boolean; errors?: string[] }> {
    await this.ensureInitialized();
    const result = ConfigSchema.safeParse(this.store.store);
    
    if (result.success) {
      return { valid: true };
    }
    
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    );
    
    return { valid: false, errors };
  }
}