import { ConfigSchema, Config, defaultConfig } from './schema';
import { join } from 'path';
import { platform, homedir } from 'os';
import { mkdirSync } from 'fs';
import type Conf from 'conf';
import { logger } from '../utils/logger';

export type { Config };

export class ConfigManager {
  private store: Conf<Config> | undefined;
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.init();
  }

  private async init(): Promise<void> {
    const Conf = (await import('conf')).default;
    this.store = new Conf<Config>({
      projectName: 'ultra-mcp',
      defaults: defaultConfig,
    });
  }

  private async ensureInitialized(): Promise<void> {
    await this.initialized;
  }

  // Get the entire configuration
  async getConfig(): Promise<Config> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    const rawConfig = this.store.store;
    const result = ConfigSchema.safeParse(rawConfig);
    
    if (!result.success) {
      logger.error('Invalid configuration found, resetting to defaults');
      await this.reset();
      return defaultConfig;
    }
    
    return result.data;
  }

  // Set a specific API key
  async setApiKey(provider: 'openai' | 'google' | 'azure' | 'xai', apiKey: string | undefined): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    if (!apiKey) {
      this.store.delete(`${provider}.apiKey`);
    } else {
      this.store.set(`${provider}.apiKey`, apiKey);
    }
  }

  // Get a specific API key
  async getApiKey(provider: 'openai' | 'google' | 'azure' | 'xai'): Promise<string | undefined> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    return this.store.get(`${provider}.apiKey`);
  }

  // Set a specific baseURL
  async setBaseURL(provider: 'openai' | 'google' | 'azure' | 'xai', baseURL: string | undefined): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    if (!baseURL) {
      this.store.delete(`${provider}.baseURL`);
    } else {
      this.store.set(`${provider}.baseURL`, baseURL);
    }
  }

  // Get a specific baseURL
  async getBaseURL(provider: 'openai' | 'google' | 'azure' | 'xai'): Promise<string | undefined> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    return this.store.get(`${provider}.baseURL`);
  }

  // Set Azure baseURL (deprecated, use setBaseURL instead)
  async setAzureBaseURL(baseURL: string | undefined): Promise<void> {
    return this.setBaseURL('azure', baseURL);
  }

  // Check if any API keys are configured
  async hasAnyApiKeys(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(
      config.openai?.apiKey ||
      config.google?.apiKey ||
      config.azure?.apiKey ||
      config.xai?.apiKey
    );
  }

  // Get the path to the config file
  async getConfigPath(): Promise<string> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    return this.store.path;
  }

  // Reset configuration to defaults
  async reset(): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    this.store.clear();
  }

  // Validate the current configuration
  async validate(): Promise<{ valid: boolean; errors?: string[] }> {
    await this.ensureInitialized();
    if (!this.store) {
      throw new Error('Configuration store not initialized');
    }
    const result = ConfigSchema.safeParse(this.store.store);
    
    if (result.success) {
      return { valid: true };
    }
    
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    );
    
    return { valid: false, errors };
  }

  // Get the database file path
  getDatabasePath(): string {
    const configDir = this.getConfigDir();
    return join(configDir, 'usage.db');
  }

  // Get the configuration directory path
  private getConfigDir(): string {
    const os = platform();
    let configDir: string;

    if (os === 'win32') {
      // Windows: %APPDATA%/ultra-mcp-nodejs/
      const appData = process.env.APPDATA;
      if (!appData) {
        throw new Error('APPDATA environment variable not found');
      }
      configDir = join(appData, 'ultra-mcp-nodejs');
    } else {
      // Unix-like (macOS/Linux): ~/.config/ultra-mcp/
      configDir = join(homedir(), '.config', 'ultra-mcp');
    }

    // Ensure directory exists
    try {
      mkdirSync(configDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's ok
    }

    return configDir;
  }
}

// Singleton instance
let configManagerInstance: ConfigManager | null = null;

export async function getConfigManager(): Promise<ConfigManager> {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager();
  }
  return configManagerInstance;
}