import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigManager } from '../../config/manager';

// Mock the conf module
vi.mock('conf', () => {
  return {
    default: vi.fn().mockImplementation((options) => {
      // Create a deep copy of defaults to avoid pollution
      let store: any = options?.defaults ? JSON.parse(JSON.stringify(options.defaults)) : {};
      const mockConf = {
        get store() { return store; },
        path: '/mock/config/path',
        get: vi.fn((key: string) => {
          const keys = key.split('.');
          let value = store;
          for (const k of keys) {
            value = value?.[k];
          }
          return value;
        }),
        set: vi.fn((key: string, value: any) => {
          const keys = key.split('.');
          let obj = store;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
              obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
          }
          obj[keys[keys.length - 1]] = value;
        }),
        delete: vi.fn((key: string) => {
          const keys = key.split('.');
          let obj = store;
          for (let i = 0; i < keys.length - 1; i++) {
            obj = obj?.[keys[i]];
            if (!obj) return;
          }
          delete obj[keys[keys.length - 1]];
        }),
        clear: vi.fn(() => {
          store = options?.defaults ? JSON.parse(JSON.stringify(options.defaults)) : {};
        }),
      };
      return mockConf;
    }),
  };
});

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    vi.clearAllMocks();
    configManager = new ConfigManager();
  });

  describe('getConfig', () => {
    it('should return default config when store is empty', async () => {
      const config = await configManager.getConfig();
      expect(config).toEqual({
        openai: { apiKey: undefined },
        google: { apiKey: undefined },
        azure: { apiKey: undefined, endpoint: undefined },
        xai: { apiKey: undefined },
      });
    });
  });

  describe('setApiKey and getApiKey', () => {
    it('should set and get OpenAI API key', async () => {
      await configManager.setApiKey('openai', 'test-openai-key');
      expect(await configManager.getApiKey('openai')).toBe('test-openai-key');
    });

    it('should set and get Google API key', async () => {
      await configManager.setApiKey('google', 'test-google-key');
      expect(await configManager.getApiKey('google')).toBe('test-google-key');
    });

    it('should set and get Azure API key', async () => {
      await configManager.setApiKey('azure', 'test-azure-key');
      expect(await configManager.getApiKey('azure')).toBe('test-azure-key');
    });

    it('should set and get xAI API key', async () => {
      await configManager.setApiKey('xai', 'test-xai-key');
      expect(await configManager.getApiKey('xai')).toBe('test-xai-key');
    });

    it('should delete API key when setting to undefined', async () => {
      await configManager.setApiKey('openai', 'test-key');
      await configManager.setApiKey('openai', undefined);
      expect(await configManager.getApiKey('openai')).toBeUndefined();
    });
  });

  describe('setAzureEndpoint', () => {
    it('should set Azure endpoint', async () => {
      await configManager.setAzureEndpoint('https://test.azure.com');
      const config = await configManager.getConfig();
      expect(config.azure?.endpoint).toBe('https://test.azure.com');
    });

    it('should delete Azure endpoint when setting to undefined', async () => {
      await configManager.setAzureEndpoint('https://test.azure.com');
      await configManager.setAzureEndpoint(undefined);
      const config = await configManager.getConfig();
      expect(config.azure?.endpoint).toBeUndefined();
    });
  });

  describe('hasAnyApiKeys', () => {
    it('should return false when no API keys are set', async () => {
      expect(await configManager.hasAnyApiKeys()).toBe(false);
    });

    it('should return true when OpenAI key is set', async () => {
      await configManager.setApiKey('openai', 'test-key');
      expect(await configManager.hasAnyApiKeys()).toBe(true);
    });

    it('should return true when Google key is set', async () => {
      await configManager.setApiKey('google', 'test-key');
      expect(await configManager.hasAnyApiKeys()).toBe(true);
    });

    it('should return true when Azure key is set', async () => {
      await configManager.setApiKey('azure', 'test-key');
      expect(await configManager.hasAnyApiKeys()).toBe(true);
    });

    it('should return true when xAI key is set', async () => {
      await configManager.setApiKey('xai', 'test-key');
      expect(await configManager.hasAnyApiKeys()).toBe(true);
    });
  });

  describe('getConfigPath', () => {
    it('should return the config file path', async () => {
      expect(await configManager.getConfigPath()).toBe('/mock/config/path');
    });
  });

  describe('reset', () => {
    it('should clear all configuration', async () => {
      await configManager.setApiKey('openai', 'test-key');
      await configManager.setApiKey('google', 'test-key');
      await configManager.reset();
      
      expect(await configManager.hasAnyApiKeys()).toBe(false);
      expect(await configManager.getConfig()).toEqual({
        openai: { apiKey: undefined },
        google: { apiKey: undefined },
        azure: { apiKey: undefined, endpoint: undefined },
        xai: { apiKey: undefined },
      });
    });
  });

  describe('validate', () => {
    it('should return valid for correct configuration', async () => {
      await configManager.setApiKey('openai', 'test-key');
      const result = await configManager.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });
});