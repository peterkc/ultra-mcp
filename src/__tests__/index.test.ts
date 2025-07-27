import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startServer } from '../start-server';
import { ConfigManager } from '../config/manager';

// Mock dependencies
vi.mock('@modelcontextprotocol/sdk/server/stdio', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../config/manager');
vi.mock('../server');

describe('Server Startup', () => {
  let mockConfigManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock ConfigManager
    mockConfigManager = {
      getConfig: vi.fn().mockResolvedValue({
        openai: { apiKey: 'test-openai-key', baseURL: undefined },
        google: { apiKey: 'test-google-key', baseURL: undefined },
        azure: { apiKey: 'test-azure-key', baseURL: 'https://test.azure.com' },
        xai: { apiKey: undefined, baseURL: undefined },
      }),
    };
    
    (ConfigManager as any).mockImplementation(() => mockConfigManager);
  });

  it('should start server without loading configuration immediately', async () => {
    const { createServer } = await import('../server');
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
    };
    (createServer as any).mockReturnValue(mockServer);

    await startServer();

    // Config should NOT be loaded immediately (lazy loading)
    expect(mockConfigManager.getConfig).not.toHaveBeenCalled();

    // Check that server was started
    expect(mockServer.connect).toHaveBeenCalled();
  });

  it('should start server even without API keys', async () => {
    mockConfigManager.getConfig.mockResolvedValue({
      openai: { apiKey: undefined },
      google: { apiKey: undefined },
      azure: { apiKey: undefined, baseURL: undefined },
      xai: { apiKey: undefined, baseURL: undefined },
    });

    const { createServer } = await import('../server');
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
    };
    (createServer as any).mockReturnValue(mockServer);

    await startServer();

    expect(mockServer.connect).toHaveBeenCalled();
  });
});