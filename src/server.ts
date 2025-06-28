import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const EchoToolSchema = z.object({
  message: z.string().describe("The message to echo back"),
});

export function createServer() {
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
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "echo") {
      try {
        const args = EchoToolSchema.parse(request.params.arguments);
        
        return {
          content: [
            {
              type: "text",
              text: `Echo: ${args.message}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Invalid arguments provided`,
            },
          ],
          isError: true,
        };
      }
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Error: Unknown tool "${request.params.name}"`,
        },
      ],
      isError: true,
    };
  });

  return server;
}