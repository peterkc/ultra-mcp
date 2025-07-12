import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ConfigManager } from "./config/manager";
import { ProviderManager } from "./providers/manager";
import { AIToolHandlers } from "./handlers/ai-tools";

const EchoToolSchema = z.object({
  message: z.string().describe("The message to echo back"),
});

export function createServer() {
  const configManager = new ConfigManager();
  const providerManager = new ProviderManager(configManager);
  const aiToolHandlers = new AIToolHandlers(providerManager);

  const server = new Server(
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

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const aiTools = aiToolHandlers.getToolDefinitions();
    
    return {
      tools: [
        {
          name: "echo",
          description: "Echo back the provided message",
          inputSchema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The message to echo back",
              },
            },
            required: ["message"],
          },
        },
        ...aiTools,
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case "echo": {
          const args = EchoToolSchema.parse(request.params.arguments);
          return {
            content: [
              {
                type: "text",
                text: `Echo: ${args.message}`,
              },
            ],
          };
        }

        case "deep-reasoning": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleDeepReasoning(args as any);
        }

        case "investigate": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleInvestigation(args as any);
        }

        case "research": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleResearch(args as any);
        }

        case "list-ai-models": {
          return await aiToolHandlers.handleListModels();
        }

        // Zen-inspired simplified tools
        case "analyze-code": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleAnalyzeCode(args as any);
        }

        case "review-code": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleReviewCode(args as any);
        }

        case "debug-issue": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleDebugIssue(args as any);
        }

        case "plan-feature": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handlePlanFeature(args as any);
        }

        case "generate-docs": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleGenerateDocs(args as any);
        }

        case "challenge": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleChallenge(args as any);
        }

        case "consensus": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleConsensus(args as any);
        }

        case "planner": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handlePlanner(args as any);
        }

        case "precommit": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handlePrecommit(args as any);
        }

        case "secaudit": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleSecaudit(args as any);
        }

        case "tracer": {
          const args = request.params.arguments || {};
          return await aiToolHandlers.handleTracer(args as any);
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: `Error: Unknown tool "${request.params.name}"`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
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
  });

  return server;
}