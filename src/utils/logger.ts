/**
 * Logger utility that respects MCP stdio requirements
 * When running as MCP server, stdout is reserved for JSON-RPC messages
 * All logging should go to stderr or be suppressed
 */

// Check if we're running as an MCP server (no subcommand provided)
const isMCPServer = process.argv.length <= 2 || process.argv[2] === undefined;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (!isMCPServer) {
      console.log(message, ...args);
    }
    // In MCP mode, suppress regular logs to avoid corrupting stdout
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args); // stderr is safe for MCP
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args); // stderr is safe for MCP
  },
  
  debug: (message: string, ...args: any[]) => {
    if (!isMCPServer && process.env.DEBUG) {
      console.log('[DEBUG]', message, ...args);
    }
  }
};