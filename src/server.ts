import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolDefinitions } from "./tools/definitions";

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