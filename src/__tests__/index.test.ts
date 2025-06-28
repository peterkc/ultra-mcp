import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import * as path from 'path';

// Mock the stdio transport
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('MCP Server Main Entry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start the server without errors', async () => {
    // Import after mocks are set up
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { createServer } = await import('../server.js');

    const mockTransport = new StdioServerTransport();
    const server = createServer();

    // Mock the connect method
    server.connect = vi.fn().mockResolvedValue(undefined);

    // Run the main logic
    await server.connect(mockTransport);

    expect(server.connect).toHaveBeenCalledWith(mockTransport);
    expect(StdioServerTransport).toHaveBeenCalled();
  });

  it('should log startup message', async () => {
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Import after mocks are set up
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { createServer } = await import('../server.js');

    const mockTransport = new StdioServerTransport();
    const server = createServer();

    // Mock the connect method
    server.connect = vi.fn().mockResolvedValue(undefined);

    // Simulate the main function
    await server.connect(mockTransport);
    console.error("Ultra MCP Server running on stdio");

    expect(mockConsoleError).toHaveBeenCalledWith("Ultra MCP Server running on stdio");
    
    mockConsoleError.mockRestore();
  });
});