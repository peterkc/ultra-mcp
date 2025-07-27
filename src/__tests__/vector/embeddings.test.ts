import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingProvider, getDefaultEmbeddingProvider } from '../../providers/embeddings';
import { ConfigManager } from '../../config/manager';

// Mock AI SDK modules
vi.mock('ai', () => ({
  embed: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: {
    embedding: vi.fn(),
  },
}));

vi.mock('@ai-sdk/google', () => ({
  google: {
    embedding: vi.fn(),
  },
}));

vi.mock('@ai-sdk/azure', () => ({
  createAzure: vi.fn(() => ({
    embedding: vi.fn(),
  })),
}));

describe('EmbeddingProvider', () => {
  let configManager: ConfigManager;
  let mockConfig: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConfig = {
      openai: { apiKey: 'test-openai-key' },
      google: { apiKey: 'test-google-key' },
      azure: { apiKey: 'test-azure-key', resourceName: 'test' },
      vectorConfig: {
        defaultProvider: 'openai',
      },
    };

    configManager = {
      getConfig: vi.fn().mockResolvedValue(mockConfig),
    } as any;
  });

  describe('getEmbedding', () => {
    it('should generate embedding for single text', async () => {
      const { embed } = await import('ai');
      const { openai } = await import('@ai-sdk/openai');
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4];
      const mockModel = { id: 'test-model' };
      
      (openai.embedding as any).mockReturnValue(mockModel);
      (embed as any).mockResolvedValue({ embedding: mockEmbedding });

      const provider = new EmbeddingProvider({ provider: 'openai' }, configManager);
      const result = await provider.getEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(embed).toHaveBeenCalledWith({
        model: mockModel,
        value: 'test text',
      });
    });

    it('should throw error if API key is missing', async () => {
      mockConfig.openai.apiKey = undefined;
      const provider = new EmbeddingProvider({ provider: 'openai' }, configManager);

      await expect(provider.getEmbedding('test')).rejects.toThrow('OpenAI API key not configured');
    });
  });

  describe('getEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const { embed } = await import('ai');
      const { openai } = await import('@ai-sdk/openai');
      const mockEmbeddings = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]];
      const mockModel = { id: 'test-model' };
      
      (openai.embedding as any).mockReturnValue(mockModel);
      (embed as any).mockResolvedValue({ embeddings: mockEmbeddings });

      const provider = new EmbeddingProvider({ provider: 'openai' }, configManager);
      const result = await provider.getEmbeddings(['text1', 'text2', 'text3']);

      expect(result).toEqual(mockEmbeddings);
      expect(embed).toHaveBeenCalledWith({
        model: mockModel,
        value: ['text1', 'text2', 'text3'],
      });
    });
  });

  describe('provider selection', () => {
    it('should use OpenAI provider', async () => {
      const { openai } = await import('@ai-sdk/openai');
      const mockModel = { id: 'mock-model' };
      (openai.embedding as any).mockReturnValue(mockModel);

      const provider = new EmbeddingProvider({ provider: 'openai' }, configManager);
      const { embed } = await import('ai');
      (embed as any).mockResolvedValue({ embedding: [0.1, 0.2] });

      await provider.getEmbedding('test');

      expect(openai.embedding).toHaveBeenCalledWith('text-embedding-3-large', {
        apiKey: 'test-openai-key',
        baseURL: undefined,
      });
    });

    it('should use Azure provider with resource name extraction', async () => {
      const { createAzure } = await import('@ai-sdk/azure');
      const mockEmbedding = vi.fn();
      (createAzure as any).mockReturnValue({ embedding: mockEmbedding });
      mockEmbedding.mockReturnValue({ id: 'mock-model' });

      const provider = new EmbeddingProvider({ provider: 'azure' }, configManager);
      const { embed } = await import('ai');
      (embed as any).mockResolvedValue({ embedding: [0.1, 0.2] });

      await provider.getEmbedding('test');

      expect(createAzure).toHaveBeenCalledWith({
        apiKey: 'test-azure-key',
        resourceName: 'test',
      });
      expect(mockEmbedding).toHaveBeenCalledWith('text-embedding-3-large');
    });

    it('should use Google provider', async () => {
      const { google } = await import('@ai-sdk/google');
      const mockModel = { id: 'mock-model' };
      (google.embedding as any).mockReturnValue(mockModel);

      const provider = new EmbeddingProvider({ provider: 'gemini' }, configManager);
      const { embed } = await import('ai');
      (embed as any).mockResolvedValue({ embedding: [0.1, 0.2] });

      await provider.getEmbedding('test');

      expect(google.embedding).toHaveBeenCalledWith('text-embedding-004', {
        apiKey: 'test-google-key',
        baseURL: undefined,
      });
    });
  });
});

describe('getDefaultEmbeddingProvider', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    vi.clearAllMocks();
    configManager = {
      getConfig: vi.fn(),
    } as any;
  });

  it('should prefer configured default provider', async () => {
    (configManager.getConfig as any).mockResolvedValue({
      openai: { apiKey: 'key' },
      vectorConfig: { defaultProvider: 'gemini' },
      google: { apiKey: 'google-key' },
    });

    const provider = await getDefaultEmbeddingProvider(configManager);
    expect(provider).toBeInstanceOf(EmbeddingProvider);
  });

  it('should prefer Azure if configured and no default specified', async () => {
    (configManager.getConfig as any).mockResolvedValue({
      openai: { apiKey: 'key' },
      azure: { apiKey: 'azure-key', baseURL: 'https://test.openai.azure.com' },
    });

    const provider = await getDefaultEmbeddingProvider(configManager);
    expect(provider).toBeInstanceOf(EmbeddingProvider);
  });

  it('should throw error if no providers configured', async () => {
    (configManager.getConfig as any).mockResolvedValue({});

    await expect(getDefaultEmbeddingProvider(configManager)).rejects.toThrow(
      'No embedding provider configured'
    );
  });
});