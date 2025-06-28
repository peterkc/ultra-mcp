import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runDoctorWithDeps } from '../../commands/doctor-injectable';
import { createMockContext, setupDefaultMocks } from '../mocks/index';

describe('Doctor Command E2E', () => {
  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    table: vi.fn(),
    clear: vi.fn(),
    count: vi.fn(),
    countReset: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    timeLog: vi.fn(),
    assert: vi.fn(),
    dir: vi.fn(),
    dirxml: vi.fn(),
  };

  const mockProcess = {
    exit: vi.fn(),
    env: {},
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show all checks passing when providers are configured', async () => {
    const context = createMockContext();
    setupDefaultMocks(context);

    await runDoctorWithDeps({}, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      env: {},
    });

    // Check that we logged the header
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Ultra MCP Doctor'));
    
    // Check that we showed success for configuration
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ Configuration file:')
    );

    // Check that we showed all provider keys as configured
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ OpenAI API Key:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ Google API Key:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ Azure OpenAI:')
    );

    // Check success summary
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Everything looks good!')
    );

    // Should not exit with error
    expect(mockProcess.exit).not.toHaveBeenCalled();
  });

  it('should show errors when no providers are configured', async () => {
    const context = createMockContext();
    // Don't set up default mocks - leave everything unconfigured

    await runDoctorWithDeps({}, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      env: {},
    });

    // Check that we showed failures
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('❌ OpenAI API Key:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('❌ Google API Key:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('❌ Azure OpenAI:')
    );

    // Check that we showed recommendations
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Some issues were found')
    );

    // Should exit with error code
    expect(mockProcess.exit).toHaveBeenCalledWith(1);
  });

  it('should test provider connections when --test flag is used', async () => {
    const context = createMockContext();
    setupDefaultMocks(context);

    await runDoctorWithDeps({ test: true }, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      env: {},
    });

    // Check that we showed "Testing provider connections"
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Testing provider connections')
    );

    // Check that we tested each provider
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ openai connection:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ gemini connection:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ azure connection:')
    );
  });

  it('should check environment variables when config is missing', async () => {
    const context = createMockContext();
    // Clear config but set env vars
    context.configManager.clearConfig();

    const env = {
      OPENAI_API_KEY: 'sk-test-key',
      GOOGLE_API_KEY: 'google-test-key',
      AZURE_API_KEY: 'azure-test-key',
      AZURE_ENDPOINT: 'https://test.openai.azure.com/',
    };

    await runDoctorWithDeps({}, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      env,
    });

    // Should still show providers as configured via env vars
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ OpenAI API Key:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ Google API Key:')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('✅ Azure OpenAI:')
    );
  });
});