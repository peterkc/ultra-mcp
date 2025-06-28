# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server called "Ultra MCP" that exposes OpenAI and Gemini AI models through a single MCP interface for use with Claude Code and Cursor. The project uses TypeScript, Node.js, and the Vercel AI SDK.

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the MCP server locally (after building)
node dist/index.js

# Development mode with TypeScript watch
npm run dev

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Run via npx (after publishing)
npx -y ultra-mcp
```

## Architecture

This MCP server acts as a bridge between multiple AI model providers and MCP clients:

1. **MCP Protocol Layer**: Implements the Model Context Protocol to communicate with Claude Code/Cursor
2. **Model Providers**: Integrates with OpenAI, Google (Gemini), and Azure AI models via Vercel AI SDK
3. **Unified Interface**: Provides a single MCP interface to access multiple AI models

### Key Components to Implement

- `src/index.ts`: Main MCP server entry point
- `src/handlers/`: MCP protocol handlers for different tool types
- `src/providers/`: Model provider implementations (OpenAI, Gemini, Azure)
- `src/utils/`: Shared utilities for streaming, error handling, etc.

### MCP Implementation Notes

- Use the `@modelcontextprotocol/sdk` package for MCP server implementation
- Implement standard MCP tools like `chat`, `completion`, etc.
- Handle streaming responses properly for real-time model outputs
- Implement proper error handling and model fallbacks
- Support environment variables for API keys (OPENAI_API_KEY, GOOGLE_API_KEY, etc.)

## TypeScript Configuration

Create a `tsconfig.json` for proper TypeScript compilation:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## MCP Server Configuration

When implementing, the MCP server should be configured in Claude Code or Cursor's settings:
```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-key",
        "GOOGLE_API_KEY": "your-key"
      }
    }
  }
}
```

## Coding Guide

1. Be a good TypeScript citizen, DO NOT USE `as any`. Find good typing when needed.
2. Run `npm run lint` after each code iteration. Fix any lint errors if any.
3. Have good unit test coverage. For 3rd party dependencies which are hard to test, mock them. But don't write test for test. Just need good coverage for complicated logic.
