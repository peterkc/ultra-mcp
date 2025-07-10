import { describe, it, expect, vi, beforeEach } from 'vitest';
import prompts from 'prompts';
import { runInteractiveConfig } from '../../config/interactive';
import { ConfigManager } from '../../config/manager';

// Mock modules
vi.mock('prompts');
vi.mock('chalk', () => {
  const createChainableStyle = () => {
    const chainable: any = vi.fn((text: string) => text);
    chainable.bold = vi.fn((text: string) => text);
    // Add other style methods
    chainable.blue = chainable;
    chainable.gray = chainable;
    chainable.yellow = chainable;
    chainable.green = chainable;
    chainable.red = chainable;
    return chainable;
  };
  
  return {
    default: {
      blue: createChainableStyle(),
      gray: createChainableStyle(),
      yellow: createChainableStyle(),
      green: createChainableStyle(),
      red: createChainableStyle(),
      bold: vi.fn((text: string) => text),
    }
  };
});

vi.mock('../../config/manager');

describe('Interactive Config', () => {
  let mockConfigManager: any;
  let mockPrompts: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock ConfigManager
    mockConfigManager = {
      getConfig: vi.fn().mockResolvedValue({
        openai: { apiKey: undefined },
        google: { apiKey: undefined },
        azure: { apiKey: undefined, endpoint: undefined },
      }),
      getConfigPath: vi.fn().mockResolvedValue('/mock/config/path'),
      setApiKey: vi.fn().mockResolvedValue(undefined),
      setAzureEndpoint: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
    };
    
    (ConfigManager as any).mockImplementation(() => mockConfigManager);
    
    // Setup mock prompts
    mockPrompts = prompts as any;
    mockPrompts.mockReset();
  });

  describe('Main menu', () => {
    it('should show main menu and exit on exit selection', async () => {
      mockPrompts.mockResolvedValueOnce({ action: 'exit' });
      
      await runInteractiveConfig();
      
      expect(mockPrompts).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'select',
          name: 'action',
          message: 'What would you like to do?',
        }),
      ]);
    });
  });

  describe('Configure API Keys', () => {
    it('should configure OpenAI API key', async () => {
      mockPrompts
        .mockResolvedValueOnce({ action: 'configure' })
        .mockResolvedValueOnce({ apiKey: 'new-openai-key' })
        .mockResolvedValueOnce({ apiKey: '' }) // Skip Google
        .mockResolvedValueOnce({ configureAzure: false })
        .mockResolvedValueOnce({ configureXai: false })
        .mockResolvedValueOnce({ action: 'exit' }); // Exit after config
      
      await runInteractiveConfig();
      
      expect(mockConfigManager.setApiKey).toHaveBeenCalledWith('openai', 'new-openai-key');
    });

    it('should clear API key when user enters "clear"', async () => {
      mockPrompts
        .mockResolvedValueOnce({ action: 'configure' })
        .mockResolvedValueOnce({ apiKey: 'clear' })
        .mockResolvedValueOnce({ apiKey: '' }) // Skip Google
        .mockResolvedValueOnce({ configureAzure: false })
        .mockResolvedValueOnce({ configureXai: false })
        .mockResolvedValueOnce({ action: 'exit' });
      
      await runInteractiveConfig();
      
      expect(mockConfigManager.setApiKey).toHaveBeenCalledWith('openai', undefined);
    });

    it('should configure Azure with API key and endpoint', async () => {
      mockPrompts
        .mockResolvedValueOnce({ action: 'configure' })
        .mockResolvedValueOnce({ apiKey: '' }) // Skip OpenAI
        .mockResolvedValueOnce({ apiKey: '' }) // Skip Google
        .mockResolvedValueOnce({ configureAzure: true })
        .mockResolvedValueOnce({ 
          apiKey: 'azure-key',
          endpoint: 'https://test.azure.com'
        })
        .mockResolvedValueOnce({ configureXai: false })
        .mockResolvedValueOnce({ action: 'exit' });
      
      await runInteractiveConfig();
      
      expect(mockConfigManager.setApiKey).toHaveBeenCalledWith('azure', 'azure-key');
      expect(mockConfigManager.setAzureEndpoint).toHaveBeenCalledWith('https://test.azure.com');
    });
  });

  describe('View Configuration', () => {
    it('should display current configuration with masked API keys', async () => {
      mockConfigManager.getConfig.mockResolvedValue({
        openai: { apiKey: 'sk-1234567890abcdef' },
        google: { apiKey: 'test-google-key' },
        azure: { apiKey: undefined, endpoint: undefined },
      });
      
      mockPrompts
        .mockResolvedValueOnce({ action: 'view' })
        .mockResolvedValueOnce({ continue: '' })
        .mockResolvedValueOnce({ action: 'exit' });
      
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await runInteractiveConfig();
      
      // Check that console.log was called multiple times
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Find the calls that contain masked API keys
      const calls = consoleLogSpy.mock.calls;
      const hasOpenAIMaskedKey = calls.some(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('sk-1****cdef'))
      );
      const hasGoogleMaskedKey = calls.some(call => 
        call.some(arg => typeof arg === 'string' && arg.includes('test****-key'))
      );
      
      expect(hasOpenAIMaskedKey).toBe(true);
      expect(hasGoogleMaskedKey).toBe(true);
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('Reset Configuration', () => {
    it('should reset configuration when confirmed', async () => {
      mockPrompts
        .mockResolvedValueOnce({ action: 'reset' })
        .mockResolvedValueOnce({ confirm: true })
        .mockResolvedValueOnce({ action: 'exit' });
      
      await runInteractiveConfig();
      
      expect(mockConfigManager.reset).toHaveBeenCalled();
    });

    it('should not reset configuration when cancelled', async () => {
      mockPrompts
        .mockResolvedValueOnce({ action: 'reset' })
        .mockResolvedValueOnce({ confirm: false })
        .mockResolvedValueOnce({ action: 'exit' });
      
      await runInteractiveConfig();
      
      expect(mockConfigManager.reset).not.toHaveBeenCalled();
    });
  });
});