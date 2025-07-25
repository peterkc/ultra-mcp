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
  
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Ultra MCP Server running on stdio");
}