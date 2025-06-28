import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ConfigManager } from "./config/manager.js";
import { ProviderManager } from "./providers/manager.js";
import { AIToolHandlers } from "./handlers/ai-tools.js";

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