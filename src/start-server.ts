import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";
import { ConfigManager } from "./config/manager";

export async function startServer(): Promise<void> {
  // Load configuration
  const configManager = new ConfigManager();
  const config = await configManager.getConfig();
  
  // Set environment variables from config
  if (config.openai?.apiKey) {
    process.env.OPENAI_API_KEY = config.openai.apiKey;
  }
  if (config.google?.apiKey) {
    process.env.GOOGLE_API_KEY = config.google.apiKey;
  }
  if (config.azure?.apiKey) {
    process.env.AZURE_API_KEY = config.azure.apiKey;
  }
  if (config.azure?.endpoint) {
    process.env.AZURE_ENDPOINT = config.azure.endpoint;
  }
  
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Ultra MCP Server running on stdio");
}