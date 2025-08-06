import { describe, it, expect } from 'vitest';

describe('EmbeddingProvider', () => {
  it('should be able to import EmbeddingProvider module', async () => {
    // Just test that the module can be imported without errors
    const { EmbeddingProvider, getDefaultEmbeddingProvider } = await import('../../providers/embeddings');
    expect(EmbeddingProvider).toBeDefined();
    expect(typeof EmbeddingProvider).toBe('function');
    expect(getDefaultEmbeddingProvider).toBeDefined();
    expect(typeof getDefaultEmbeddingProvider).toBe('function');
  });

  it('should create EmbeddingProvider instance', async () => {
    const { EmbeddingProvider } = await import('../../providers/embeddings');
    
    // Simple mock config manager
    const mockConfigManager = {
      getConfig: async () => ({
        openai: { apiKey: 'test-key' },
        vectorConfig: { defaultProvider: 'openai' }
      })
    };
    
    const provider = new EmbeddingProvider({ provider: 'openai' }, mockConfigManager as any);
    expect(provider).toBeDefined();
    expect(provider.getEmbedding).toBeDefined();
    expect(typeof provider.getEmbedding).toBe('function');
  });
});