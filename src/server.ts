import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createServer() {
  const server = new McpServer(
    {
      name: "ultra-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define minimal tool schemas for registration
  // Real schemas will be loaded when handlers are initialized
  const toolDefinitions = [
    {
      name: "deep-reasoning",
      description: "Use advanced AI models for deep reasoning and complex problem-solving. Supports O3 models for OpenAI/Azure and Gemini 2.5 Pro with Google Search.",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "investigate",
      description: "Investigate topics thoroughly with configurable depth",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "research",
      description: "Conduct comprehensive research with multiple output formats",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "list-ai-models",
      description: "List all available AI models and their configuration status",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "analyze-code",
      description: "Analyze code for architecture, performance, security, or quality issues",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "review-code",
      description: "Review code for bugs, security issues, performance, or style problems",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "debug-issue",
      description: "Debug technical issues with systematic problem-solving approach",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "plan-feature",
      description: "Plan feature implementation with step-by-step approach",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "generate-docs",
      description: "Generate documentation in various formats",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "challenge",
      description: "Challenge a statement or assumption with critical thinking",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "consensus",
      description: "Get consensus from multiple AI models on a proposal",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "planner",
      description: "Multi-step planning with revisions and branches",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "precommit",
      description: "Pre-commit validation for code changes",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "secaudit",
      description: "Security audit for code and configurations",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    },
    {
      name: "tracer",
      description: "Trace execution flow and debug complex issues",
      inputSchema: { type: "object", properties: {}, additionalProperties: true }
    }
  ];

  // Lazy loading of handlers
  let handlers: any = null;
  
  async function getHandlers() {
    if (!handlers) {
      const { ConfigManager } = require("./config/manager");
      const { ProviderManager } = require("./providers/manager");
      const { AIToolHandlers } = require("./handlers/ai-tools");
      
      const configManager = new ConfigManager();
      
      // Load config and set environment variables
      const config = await configManager.getConfig();
      if (config.openai?.apiKey) {
        process.env.OPENAI_API_KEY = config.openai.apiKey;
      }
      if (config.openai?.baseURL) {
        process.env.OPENAI_BASE_URL = config.openai.baseURL;
      }
      if (config.google?.apiKey) {
        process.env.GOOGLE_API_KEY = config.google.apiKey;
      }
      if (config.google?.baseURL) {
        process.env.GOOGLE_BASE_URL = config.google.baseURL;
      }
      if (config.azure?.apiKey) {
        process.env.AZURE_API_KEY = config.azure.apiKey;
      }
      if (config.azure?.baseURL) {
        process.env.AZURE_BASE_URL = config.azure.baseURL;
      }
      if (config.xai?.apiKey) {
        process.env.XAI_API_KEY = config.xai.apiKey;
      }
      if (config.xai?.baseURL) {
        process.env.XAI_BASE_URL = config.xai.baseURL;
      }
      
      const providerManager = new ProviderManager(configManager);
      handlers = new AIToolHandlers(providerManager);
    }
    
    return handlers;
  }

  // Register all tools
  for (const tool of toolDefinitions) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      async (args) => {
        try {
          // Get handlers lazily
          const aiHandlers = await getHandlers();
          
          // Map tool names to handler methods
          const handlerMap: Record<string, (args: any) => Promise<any>> = {
            "deep-reasoning": (args) => aiHandlers.handleDeepReasoning(args),
            "investigate": (args) => aiHandlers.handleInvestigation(args),
            "research": (args) => aiHandlers.handleResearch(args),
            "list-ai-models": () => aiHandlers.handleListModels(),
            "analyze-code": (args) => aiHandlers.handleAnalyzeCode(args),
            "review-code": (args) => aiHandlers.handleReviewCode(args),
            "debug-issue": (args) => aiHandlers.handleDebugIssue(args),
            "plan-feature": (args) => aiHandlers.handlePlanFeature(args),
            "generate-docs": (args) => aiHandlers.handleGenerateDocs(args),
            "challenge": (args) => aiHandlers.handleChallenge(args),
            "consensus": (args) => aiHandlers.handleConsensus(args),
            "planner": (args) => aiHandlers.handlePlanner(args),
            "precommit": (args) => aiHandlers.handlePrecommit(args),
            "secaudit": (args) => aiHandlers.handleSecaudit(args),
            "tracer": (args) => aiHandlers.handleTracer(args),
          };
          
          const handler = handlerMap[tool.name];
          if (!handler) {
            throw new Error(`No handler found for tool: ${tool.name}`);
          }
          
          return await handler(args);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}