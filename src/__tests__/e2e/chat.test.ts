import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runChatWithDeps } from '../../commands/chat-injectable';
import { createMockContext, setupDefaultMocks } from '../mocks/index';
import { MockAIProvider } from '../mocks/ai-provider';
import { Readable, Writable } from 'stream';
import * as readline from 'readline';

describe('Chat Command E2E', () => {
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

  let mockProcess: any;
  let mockStdin: Readable;
  let mockStdout: Writable;
  let stdoutData: string;

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutData = '';
    
    mockStdin = new Readable({
      read() {}
    });

    mockStdout = new Writable({
      write(chunk: any, encoding: any, callback: any) {
        stdoutData += chunk.toString();
        if (callback) callback();
        return true;
      }
    });

    mockProcess = {
      exit: vi.fn(),
      env: {},
      stdin: mockStdin,
      stdout: mockStdout,
    };
  });

  it('should exit with error when no providers are configured', async () => {
    const context = createMockContext();
    // Don't set up providers - leave unconfigured

    await runChatWithDeps({}, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
    });

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('No AI providers configured')
    );
    expect(mockProcess.exit).toHaveBeenCalledWith(1);
  });

  it('should start chat with default provider', async () => {
    const context = createMockContext();
    setupDefaultMocks(context);

    // Create a custom readline interface that we can control
    const mockRl = Object.assign(readline.createInterface({
      input: mockStdin,
      output: mockStdout,
    }), {
      [Symbol.asyncIterator]: async function* () {
        yield 'Hello AI';
        yield 'exit';
      }
    });

    const createReadlineInterface = vi.fn(() => mockRl);

    const chatPromise = runChatWithDeps({}, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      createReadlineInterface,
    });

    // Wait a bit for the chat to process
    await new Promise(resolve => setTimeout(resolve, 100));

    // Trigger the exit
    mockRl.emit('line', 'exit');

    await chatPromise;

    // Check that chat started successfully
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Ultra MCP Chat')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Provider: openai')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Model: mock-model')
    );
  });

  it('should handle chat interaction with streaming', async () => {
    const context = createMockContext();
    setupDefaultMocks(context);

    // Set up a mock provider with streaming response
    const mockProvider = context.providerManager.getMockProvider('openai');
    if (mockProvider) {
      mockProvider.setStreamResponse('Hello AI', ['Hello', ' from', ' AI!'], 'mock-model');
    }

    // Create readline mock
    let lineHandler: ((line: string) => void) | undefined;
    const mockRl = {
      prompt: vi.fn(),
      close: vi.fn(),
      on: vi.fn((event: string, handler: any) => {
        if (event === 'line') {
          lineHandler = handler;
        }
        return mockRl;
      }),
      [Symbol.asyncIterator]: async function* () {
        yield 'Hello AI';
        yield 'exit';
      }
    };

    const createReadlineInterface = vi.fn(() => mockRl as any);

    const chatPromise = runChatWithDeps({}, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      createReadlineInterface,
    });

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 50));

    await chatPromise;

    // Verify streaming output
    expect(stdoutData).toContain('Hello from AI!');
  });

  it('should handle provider selection', async () => {
    const context = createMockContext();
    setupDefaultMocks(context);

    const mockRl = {
      prompt: vi.fn(),
      close: vi.fn(),
      on: vi.fn(() => mockRl),
      [Symbol.asyncIterator]: async function* () {
        yield 'exit';
      }
    };

    const createReadlineInterface = vi.fn(() => mockRl as any);

    await runChatWithDeps({ provider: 'gemini' }, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      createReadlineInterface,
    });

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Provider: gemini')
    );
  });

  it('should handle invalid provider selection', async () => {
    const context = createMockContext();
    setupDefaultMocks(context);

    await runChatWithDeps({ provider: 'invalid-provider' }, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
    });

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Provider "invalid-provider" is not configured')
    );
    expect(mockProcess.exit).toHaveBeenCalledWith(1);
  });

  it('should handle AI errors gracefully', async () => {
    const context = createMockContext();
    setupDefaultMocks(context);

    // Make the provider throw an error
    const mockProvider = context.providerManager.getMockProvider('openai');
    if (mockProvider) {
      mockProvider.setShouldThrowError(true, 'API rate limit exceeded');
    }

    const mockRl = {
      prompt: vi.fn(),
      close: vi.fn(),
      on: vi.fn(() => mockRl),
      [Symbol.asyncIterator]: async function* () {
        yield 'Hello AI';
        yield 'exit';
      }
    };

    const createReadlineInterface = vi.fn(() => mockRl as any);

    await runChatWithDeps({}, {
      configManager: context.configManager,
      providerManager: context.providerManager,
      console: mockConsole as any,
      process: mockProcess,
      createReadlineInterface,
    });

    // Should show error but continue
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Error:'),
      'API rate limit exceeded'
    );
  });
});