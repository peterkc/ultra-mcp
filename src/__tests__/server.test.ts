import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../server';
import type { CallToolRequest, ListToolsRequest } from '@modelcontextprotocol/sdk/types.js';

describe('Ultra MCP Server', () => {
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    server = createServer();
  });

  describe('ListTools', () => {
    it('should return all available tools including echo', async () => {
      const request = {
        method: 'tools/list' as const,
        params: {},
      };

      // Simulate the handler being called
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/list');
      const response = await handler?.(request, {});

      expect(response.tools).toBeDefined();
      expect(response.tools.length).toBeGreaterThan(1);
      
      // Check that echo tool exists
      const echoTool = response.tools.find((tool: any) => tool.name === 'echo');
      expect(echoTool).toBeDefined();
      expect(echoTool).toEqual({
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
      });
      
      // Check that AI tools exist
      const aiTools = ['deep-reasoning', 'investigate', 'research', 'list-ai-models'];
      aiTools.forEach(toolName => {
        const tool = response.tools.find((t: any) => t.name === toolName);
        expect(tool).toBeDefined();
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

      expect(response.isError).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain('Error');
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
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBe(16); // echo + 4 original AI tools + 5 zen-inspired tools + 6 workflow tools
      
      // Verify echo tool is included
      const echoTool = result.tools.find((t: any) => t.name === 'echo');
      expect(echoTool).toBeDefined();
      expect(echoTool.name).toBe('echo');
    });
  });
});