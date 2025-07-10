import { describe, it, expect } from 'vitest';
import { ConfigSchema, defaultConfig } from '../../config/schema';

describe('ConfigSchema', () => {
  it('should validate a valid configuration', () => {
    const validConfig = {
      openai: {
        apiKey: 'sk-test123',
      },
      google: {
        apiKey: 'test-google-key',
      },
      azure: {
        apiKey: 'test-azure-key',
        endpoint: 'https://test.azure.com',
      },
      xai: {
        apiKey: 'xai-test-key',
      },
    };

    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validConfig);
    }
  });

  it('should validate a partial configuration', () => {
    const partialConfig = {
      openai: {
        apiKey: 'sk-test123',
      },
    };

    const result = ConfigSchema.safeParse(partialConfig);
    expect(result.success).toBe(true);
  });

  it('should validate an empty configuration', () => {
    const emptyConfig = {};
    const result = ConfigSchema.safeParse(emptyConfig);
    expect(result.success).toBe(true);
  });

  it('should accept undefined API keys', () => {
    const configWithUndefined = {
      openai: {
        apiKey: undefined,
      },
      google: {
        apiKey: undefined,
      },
    };

    const result = ConfigSchema.safeParse(configWithUndefined);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL for Azure endpoint', () => {
    const invalidConfig = {
      azure: {
        apiKey: 'test-key',
        endpoint: 'not-a-url',
      },
    };

    const result = ConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('endpoint');
    }
  });

  it('should have correct default configuration', () => {
    expect(defaultConfig).toEqual({
      openai: {
        apiKey: undefined,
      },
      google: {
        apiKey: undefined,
      },
      azure: {
        apiKey: undefined,
        endpoint: undefined,
      },
      xai: {
        apiKey: undefined,
      },
    });
  });

  it('should accept empty string as API key', () => {
    const configWithEmptyString = {
      openai: {
        apiKey: '',
      },
    };

    const result = ConfigSchema.safeParse(configWithEmptyString);
    expect(result.success).toBe(false); // min(1) validation should fail
  });
});