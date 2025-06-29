import { describe, it, expect } from 'vitest';
import { ConfigSchema, defaultConfig, type Config } from '../schema';

describe('Config Schema', () => {
  describe('defaultConfig', () => {
    it('should have all provider API keys undefined by default', () => {
      expect(defaultConfig.openai?.apiKey).toBeUndefined();
      expect(defaultConfig.google?.apiKey).toBeUndefined();
      expect(defaultConfig.azure?.apiKey).toBeUndefined();
      expect(defaultConfig.azure?.endpoint).toBeUndefined();
    });
  });

  describe('ConfigSchema validation', () => {
    it('should accept valid OpenAI configuration', () => {
      const config: Config = {
        openai: { apiKey: 'sk-test-key' },
      };
      
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid Google configuration', () => {
      const config: Config = {
        google: { apiKey: 'AIza-test-key' },
      };
      
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid Azure configuration', () => {
      const config: Config = {
        azure: {
          apiKey: 'test-azure-key',
          endpoint: 'https://test.openai.azure.com',
        },
      };
      
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept configuration with all providers', () => {
      const config: Config = {
        openai: { apiKey: 'sk-test' },
        google: { apiKey: 'AIza-test' },
        azure: {
          apiKey: 'azure-test',
          endpoint: 'https://test.openai.azure.com',
        },
      };
      
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept empty configuration', () => {
      const config: Config = {};
      
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid configuration structure', () => {
      const invalidConfig = {
        openai: 'not-an-object',
      };
      
      const result = ConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should handle configuration with extra fields', () => {
      const configWithExtra = {
        openai: { apiKey: 'sk-test' },
        unknownProvider: { apiKey: 'test' },
      };
      
      const result = ConfigSchema.safeParse(configWithExtra);
      // Zod by default strips unknown keys unless .strict() is used
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          openai: { apiKey: 'sk-test' },
        });
      }
    });
  });
});