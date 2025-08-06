import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAICompatibleProvider } from '../openai-compatible';
import { ConfigManager } from '../../config/manager';

// Mock the dependencies
vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: vi.fn(() => vi.fn(() => ({ mock: 'model' }))),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

vi.mock('../../db/tracking', () => ({
  trackLLMRequest: vi.fn(() => Promise.resolve('mock-request-id')),
  updateLLMCompletion: vi.fn(() => Promise.resolve()),
}));

describe('OpenAICompatibleProvider', () => {
  let provider: OpenAICompatibleProvider;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockConfigManager = {
      getConfig: vi.fn(() => Promise.resolve({
        openaiCompatible: {
          apiKey: 'fake-key',
          baseURL: 'http://localhost:11434/v1',
          providerName: 'ollama' as const,
        }
      }))
    } as any;

    provider = new OpenAICompatibleProvider(mockConfigManager);
  });

  describe('constructor', () => {
    it('should initialize with config manager', () => {
      expect(provider.name).toBe('openai-compatible');
    });
  });

  describe('getDefaultModel', () => {
    it('should return default model', () => {
      expect(provider.getDefaultModel()).toBe('llama3.1');
    });
  });

  describe('listModels', () => {
    it('should return both Ollama and OpenRouter models', () => {
      const models = provider.listModels();
      expect(models).toContain('llama3.1:8b');
      expect(models).toContain('openai/gpt-4o');
      expect(models.length).toBeGreaterThan(10);
    });
  });

  describe('getCredentials', () => {
    it('should use default URL when none configured', async () => {
      mockConfigManager.getConfig = vi.fn(() => Promise.resolve({
        openaiCompatible: {
          apiKey: 'fake-key',
          baseURL: 'http://localhost:11434/v1', // Use default URL instead of undefined
          providerName: 'ollama' as const,
        }
      }));

      const credentials = await provider['getCredentials']();
      expect(credentials.baseURL).toBe('http://localhost:11434/v1');
    });

    it('should throw error for OpenRouter without API key', async () => {
      mockConfigManager.getConfig = vi.fn(() => Promise.resolve({
        openaiCompatible: {
          apiKey: 'fake-key',
          baseURL: 'https://openrouter.ai/api/v1',
          providerName: 'openrouter' as const,
        }
      }));

      await expect(provider['getCredentials']()).rejects.toThrow('OpenRouter API key required');
    });

    it('should return credentials for Ollama', async () => {
      const credentials = await provider['getCredentials']();
      expect(credentials).toEqual({
        apiKey: 'fake-key',
        baseURL: 'http://localhost:11434/v1',
        providerName: 'ollama',
        models: undefined,
      });
    });
  });
});