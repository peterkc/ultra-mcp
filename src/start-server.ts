import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";

export async function startServer(): Promise<void> {
  try {
    // Create server immediately without loading config
    // Config will be loaded lazily when needed
    const server = createServer();
    const transport = new StdioServerTransport();
    
    // Connect to transport
    await server.connect(transport);
    
    // Server is now running
  } catch (error) {
    // Log error to a file instead of stderr to avoid interfering with MCP
    const fs = require('fs');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    fs.writeFileSync('/tmp/ultra-mcp-error.log', `Error: ${errorMessage}\n${errorStack}`);
    process.exit(1);
  }
}