import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../server.js';
import type { CallToolRequest, ListToolsRequest } from '@modelcontextprotocol/sdk/types.js';

describe('Ultra MCP Server', () => {
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    server = createServer();
  });

  describe('ListTools', () => {
    it('should return the echo tool', async () => {
      const request = {
        method: 'tools/list' as const,
        params: {},
      };

      // Simulate the handler being called
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/list');
      const response = await handler?.(request, {});

      expect(response).toEqual({
        tools: [
          {
            name: 'echo',
            description: 'Echo back the provided message',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'The message to echo back',
                },
              },
              required: ['message'],
            },
          },
        ],
      });
    });
  });

  describe('CallTool - echo', () => {
    it('should echo back the provided message', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'echo',
          arguments: {
            message: 'Hello, World!',
          },
        },
      };

      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');
      const response = await handler?.(request, {});

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: 'Echo: Hello, World!',
          },
        ],
      });
    });

    it('should handle invalid arguments', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'echo',
          arguments: {
            // Missing required 'message' field
            wrongField: 'test',
          },
        },
      };

      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');
      const response = await handler?.(request, {});

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Invalid arguments provided',
          },
        ],
        isError: true,
      });
    });

    it('should handle unknown tools', async () => {
      const request = {
        method: 'tools/call' as const,
        params: {
          name: 'unknown-tool',
          arguments: {},
        },
      };

      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');
      const response = await handler?.(request, {});

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Unknown tool "unknown-tool"',
          },
        ],
        isError: true,
      });
    });
  });

  describe('Server configuration', () => {
    it('should have tools handlers registered', () => {
      // Check if the server has tools handlers registered
      const handlers = (server as any)._requestHandlers;
      expect(handlers.has('tools/list')).toBe(true);
      expect(handlers.has('tools/call')).toBe(true);
    });

    it('should handle tools/list requests', async () => {
      const handlers = (server as any)._requestHandlers;
      const listHandler = handlers.get('tools/list');
      expect(listHandler).toBeDefined();
      
      // Verify it returns tools when called
      const result = await listHandler({ method: 'tools/list', params: {} }, {});
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('echo');
    });
  });
});