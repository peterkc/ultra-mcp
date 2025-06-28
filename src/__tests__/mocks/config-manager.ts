import { ConfigManager } from '../../config/manager.js';
import type { Config } from '../../config/manager.js';

export class MockConfigManager extends ConfigManager {
  private mockConfig: Config = {};

  constructor(initialConfig?: Partial<Config>) {
    super();
    if (initialConfig) {
      this.mockConfig = initialConfig as Config;
    }
  }

  async getConfig(): Promise<Config> {
    return Promise.resolve(this.mockConfig);
  }

  async saveConfig(config: Config): Promise<void> {
    this.mockConfig = config;
    return Promise.resolve();
  }

  async getConfigPath(): Promise<string> {
    return Promise.resolve('/mock/config/path');
  }

  setMockConfig(config: Partial<Config>): void {
    this.mockConfig = { ...this.mockConfig, ...config };
  }

  clearConfig(): void {
    this.mockConfig = {};
  }
}