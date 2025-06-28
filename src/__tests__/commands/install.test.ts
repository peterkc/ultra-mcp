import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInstall } from '../../commands/install';
import * as child_process from 'child_process';

// Mock modules
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

vi.mock('readline', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn(),
    close: vi.fn()
  }))
}));

vi.mock('colorette', () => ({
  bold: vi.fn(text => text),
  green: vi.fn(text => text),
  yellow: vi.fn(text => text),
  red: vi.fn(text => text),
  blue: vi.fn(text => text),
  cyan: vi.fn(text => text)
}));

vi.mock('../../config/manager', () => ({
  ConfigManager: vi.fn().mockImplementation(() => ({
    getConfig: vi.fn().mockResolvedValue({
      openai: { apiKey: 'test-key' }
    })
  }))
}));

describe('install command', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should handle missing Claude Code CLI', async () => {
    const mockSpawn = vi.mocked(child_process.spawn);
    
    // Mock Claude Code not found
    mockSpawn.mockImplementation((() => {
      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() }
      };
      return mockChild;
    }) as any);

    await runInstall();

    expect(consoleLogSpy).toHaveBeenCalledWith('❌ Claude Code CLI not found');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Please install Claude Code first'));
  });

  it('should display manual installation instructions', async () => {
    const mockSpawn = vi.mocked(child_process.spawn);
    
    // Mock Claude Code not found
    mockSpawn.mockImplementation((() => {
      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() }
      };
      return mockChild;
    }) as any);

    await runInstall();

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📝 Manual Installation Instructions:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"mcpServers"'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"ultra-mcp"'));
  });
});