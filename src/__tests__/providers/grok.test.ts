import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrokProvider } from '../../providers/grok';
import { ConfigManager } from '../../config/manager';

// Mock the AI SDK
vi.mock('@ai-sdk/xai', () => ({
  xai: vi.fn(() => vi.fn()),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

// Mock the database tracking
vi.mock('../../db/tracking', () => ({
  trackLLMRequest: vi.fn().mockResolvedValue('test-request-id'),
  updateLLMCompletion: vi.fn().mockResolvedValue(undefined),
}));

describe('GrokProvider', () => {
  let provider: GrokProvider;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockConfigManager = {
      getConfig: vi.fn().mockResolvedValue({
        xai: { apiKey: 'test-xai-key' }
      })
    } as any;
    
    provider = new GrokProvider(mockConfigManager);
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('grok');
  });

  it('should return grok-4 as default model', () => {
    expect(provider.getDefaultModel()).toBe('grok-4');
  });

  it('should list available Grok models', () => {
    const models = provider.listModels();
    expect(models).toContain('grok-4');
    expect(models).toContain('grok-3');
    expect(models).toContain('grok-3-fast');
    expect(models).toContain('grok-3-mini');
    expect(models).toContain('grok-beta');
  });

  it('should throw error when API key is not configured', async () => {
    mockConfigManager.getConfig = vi.fn().mockResolvedValue({});
    
    const request = {
      prompt: 'test prompt',
      temperature: 0.7,
      useSearchGrounding: false,
      toolName: 'test-tool',
    };

    await expect(provider.generateText(request)).rejects.toThrow(
      'xAI API key not configured'
    );
  });
});