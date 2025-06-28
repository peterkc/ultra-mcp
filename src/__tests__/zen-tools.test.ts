import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIToolHandlers } from '../handlers/ai-tools';
import { MockProviderManager } from './mocks/provider-manager';

describe('Zen-Inspired Tools', () => {
  let handlers: AIToolHandlers;
  let mockProviderManager: MockProviderManager;

  beforeEach(() => {
    mockProviderManager = new MockProviderManager();
    // Set up all providers that our zen tools use as defaults
    mockProviderManager.addMockProvider('openai');
    mockProviderManager.addMockProvider('gemini');
    mockProviderManager.addMockProvider('azure');
    mockProviderManager.setConfiguredProviders(['openai', 'gemini', 'azure']);
    handlers = new AIToolHandlers(mockProviderManager as any);
  });

  describe('analyze-code tool', () => {
    it('should analyze code with default parameters', async () => {
      const params = {
        task: 'analyze authentication system',
        focus: 'all' as const, // explicit default
        provider: 'gemini' as const, // explicit default
      };

      const result = await handlers.handleAnalyzeCode(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Mock response');
      expect(result.metadata.provider).toBe('gemini'); // default provider
      expect(result.metadata.focus).toBe('all'); // default focus
    });

    it('should analyze code with specific focus and files', async () => {
      const params = {
        task: 'analyze user authentication',
        files: ['/src/auth.ts', '/src/users.ts'],
        focus: 'security' as const,
        provider: 'openai' as const,
      };

      const result = await handlers.handleAnalyzeCode(params);

      expect(result).toBeDefined();
      expect(result.metadata.provider).toBe('openai');
      expect(result.metadata.focus).toBe('security');
    });
  });

  describe('review-code tool', () => {
    it('should review code with default parameters', async () => {
      const params = {
        task: 'review pull request changes',
        focus: 'all' as const, // explicit default
        provider: 'openai' as const, // explicit default
      };

      const result = await handlers.handleReviewCode(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.metadata.provider).toBe('openai'); // default provider
      expect(result.metadata.focus).toBe('all'); // default focus
    });

    it('should review code with specific focus', async () => {
      const params = {
        task: 'check for security vulnerabilities',
        focus: 'security' as const,
        files: ['/src/api.ts'],
        provider: 'gemini' as const,
      };

      const result = await handlers.handleReviewCode(params);

      expect(result).toBeDefined();
      expect(result.metadata.provider).toBe('gemini');
      expect(result.metadata.focus).toBe('security');
    });
  });

  describe('debug-issue tool', () => {
    it('should debug issue with basic parameters', async () => {
      const params = {
        task: 'fix login error',
        provider: 'openai' as const, // explicit default
      };

      const result = await handlers.handleDebugIssue(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.metadata.provider).toBe('openai'); // default provider
    });

    it('should debug issue with symptoms and files', async () => {
      const params = {
        task: 'investigate memory leak',
        symptoms: 'Memory usage increases over time',
        files: ['/src/workers.ts', '/src/cache.ts'],
        provider: 'azure' as const,
      };

      const result = await handlers.handleDebugIssue(params);

      expect(result).toBeDefined();
      expect(result.metadata.provider).toBe('azure');
      expect(result.metadata.symptoms).toBe('Memory usage increases over time');
    });
  });

  describe('plan-feature tool', () => {
    it('should plan feature with default parameters', async () => {
      const params = {
        task: 'add user profiles',
        scope: 'standard' as const, // explicit default
        provider: 'gemini' as const, // explicit default
      };

      const result = await handlers.handlePlanFeature(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.metadata.provider).toBe('gemini'); // default provider
      expect(result.metadata.scope).toBe('standard'); // default scope
    });

    it('should plan feature with requirements and scope', async () => {
      const params = {
        task: 'implement payment system',
        requirements: 'Support Stripe and PayPal, PCI compliance required',
        scope: 'comprehensive' as const,
        provider: 'openai' as const,
      };

      const result = await handlers.handlePlanFeature(params);

      expect(result).toBeDefined();
      expect(result.metadata.provider).toBe('openai');
      expect(result.metadata.scope).toBe('comprehensive');
    });
  });

  describe('generate-docs tool', () => {
    it('should generate docs with default parameters', async () => {
      const params = {
        task: 'document API endpoints',
        format: 'markdown' as const, // explicit default
        provider: 'gemini' as const, // explicit default
      };

      const result = await handlers.handleGenerateDocs(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.metadata.provider).toBe('gemini'); // default provider
      expect(result.metadata.format).toBe('markdown'); // default format
    });

    it('should generate docs with specific format and files', async () => {
      const params = {
        task: 'create API documentation',
        files: ['/src/api/routes.ts', '/src/api/types.ts'],
        format: 'api-docs' as const,
        provider: 'azure' as const,
      };

      const result = await handlers.handleGenerateDocs(params);

      expect(result).toBeDefined();
      expect(result.metadata.provider).toBe('azure');
      expect(result.metadata.format).toBe('api-docs');
    });
  });

  describe('tool definitions', () => {
    it('should include all zen-inspired tools in definitions', () => {
      const definitions = handlers.getToolDefinitions();
      
      // Original tools: deep-reasoning, investigate, research, list-ai-models (4)
      // Zen-inspired tools: analyze-code, review-code, debug-issue, plan-feature, generate-docs (5)
      // Total: 9 tools
      expect(definitions).toHaveLength(9);

      const toolNames = definitions.map(def => def.name);
      
      // Check zen-inspired tools are included
      expect(toolNames).toContain('analyze-code');
      expect(toolNames).toContain('review-code');
      expect(toolNames).toContain('debug-issue');
      expect(toolNames).toContain('plan-feature');
      expect(toolNames).toContain('generate-docs');
    });

    it('should have proper schema for zen-inspired tools', () => {
      const definitions = handlers.getToolDefinitions();
      
      const analyzeCode = definitions.find(def => def.name === 'analyze-code');
      expect(analyzeCode).toBeDefined();
      expect(analyzeCode!.inputSchema.required).toEqual(['task']);
      expect(analyzeCode!.inputSchema.properties.task).toBeDefined();
      expect((analyzeCode!.inputSchema.properties as any).focus.default).toBe('all');
      expect((analyzeCode!.inputSchema.properties as any).provider.default).toBe('gemini');

      const reviewCode = definitions.find(def => def.name === 'review-code');
      expect(reviewCode).toBeDefined();
      expect(reviewCode!.inputSchema.required).toEqual(['task']);
      expect((reviewCode!.inputSchema.properties as any).provider.default).toBe('openai');

      const debugIssue = definitions.find(def => def.name === 'debug-issue');
      expect(debugIssue).toBeDefined();
      expect(debugIssue!.inputSchema.required).toEqual(['task']);
      expect((debugIssue!.inputSchema.properties as any).provider.default).toBe('openai');

      const planFeature = definitions.find(def => def.name === 'plan-feature');
      expect(planFeature).toBeDefined();
      expect(planFeature!.inputSchema.required).toEqual(['task']);
      expect((planFeature!.inputSchema.properties as any).scope.default).toBe('standard');
      expect((planFeature!.inputSchema.properties as any).provider.default).toBe('gemini');

      const generateDocs = definitions.find(def => def.name === 'generate-docs');
      expect(generateDocs).toBeDefined();
      expect(generateDocs!.inputSchema.required).toEqual(['task']);
      expect((generateDocs!.inputSchema.properties as any).format.default).toBe('markdown');
      expect((generateDocs!.inputSchema.properties as any).provider.default).toBe('gemini');
    });
  });
});