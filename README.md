# Ultra MCP

🚀 **Ultra MCP** - A Model Context Protocol server that exposes OpenAI and Gemini AI models through a single MCP interface for use with Claude Code and Cursor.

## Inspiration

This project is inspired by:
- **[Agent2Agent (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)** by Google - Thank you Google for pioneering agent-to-agent communication protocols
- **[Zen MCP](https://github.com/BeehiveInnovations/zen-mcp-server)** - The AI orchestration server that enables Claude to collaborate with multiple AI models

## Features

- 🤖 **Multi-Model Support**: Integrate OpenAI (O3), Google Gemini (2.5 Pro), and Azure AI models
- 🔌 **MCP Protocol**: Standard Model Context Protocol interface
- 🧠 **Deep Reasoning Tools**: Access O3 models for complex problem-solving
- 🔍 **Investigation & Research**: Built-in tools for thorough investigation and research
- 🌐 **Google Search Integration**: Gemini 2.5 Pro with real-time web search
- ⚡ **Real-time Streaming**: Live model responses via Vercel AI SDK
- 🔧 **Zero Config**: Interactive setup with smart defaults
- 🔑 **Secure Configuration**: Local API key storage with `conf` library
- 🧪 **TypeScript**: Full type safety and modern development experience

## Quick Start

### Installation

```bash
# Install globally via npm
npm install -g ultra-mcp

# Or run directly with npx
npx -y ultra config
```

### Configuration

Set up your API keys interactively:

```bash
npx -y ultra config
```

This will:
1. Show current configuration status
2. Allow you to set/update API keys for OpenAI, Google Gemini, and Azure
3. Store configuration securely on your system
4. Auto-load API keys when the server starts

### Running the Server

```bash
# Run the MCP server
npx -y ultra

# Or after building locally
npm run build
node dist/cli.js
```

### Integration with Claude Code

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "npx",
      "args": ["-y", "ultra"]
    }
  }
}
```

### Integration with Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "ultra-mcp": {
      "command": "npx", 
      "args": ["-y", "ultra"],
      "env": {
        "OPENAI_API_KEY": "your-key",
        "GOOGLE_API_KEY": "your-key"
      }
    }
  }
}
```

## MCP Tools

Ultra MCP provides powerful AI tools accessible through Claude Code and Cursor:

### 🧠 Deep Reasoning (`deep-reasoning`)
Leverage advanced AI models for complex problem-solving and analysis.
- **Default**: O3-mini for OpenAI/Azure, Gemini 2.5 Pro with Google Search
- **Use Cases**: Complex algorithms, architectural decisions, deep analysis

### 🔍 Investigate (`investigate`)
Thoroughly investigate topics with configurable depth levels.
- **Depth Levels**: shallow, medium, deep
- **Google Search**: Enabled by default for Gemini
- **Use Cases**: Research topics, explore concepts, gather insights

### 📚 Research (`research`)
Conduct comprehensive research with multiple output formats.
- **Output Formats**: summary, detailed, academic
- **Use Cases**: Literature reviews, technology comparisons, documentation

### 📋 List Models (`list-ai-models`)
View all available AI models and their configuration status.

### Example Usage

```javascript
// In Claude Code or Cursor with MCP
await use_mcp_tool("ultra-mcp", "deep-reasoning", {
  provider: "openai",
  prompt: "Design a distributed caching system for microservices",
  reasoningEffort: "high"
});
```

## Development

```bash
# Clone the repository
git clone https://github.com/RealMikeChong/ultra-mcp
cd ultra-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Development mode with watch
npm run dev

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/cli.js
```

## Architecture

Ultra MCP acts as a bridge between multiple AI model providers and MCP clients:

1. **MCP Protocol Layer**: Implements Model Context Protocol for Claude Code/Cursor communication
2. **Model Providers**: Integrates OpenAI, Google (Gemini), and Azure AI via Vercel AI SDK  
3. **Unified Interface**: Single MCP interface to access multiple AI models
4. **Configuration Management**: Secure local storage with schema validation

### Key Components

- `src/cli.ts` - CLI entry point with commander
- `src/server.ts` - MCP server implementation  
- `src/config/` - Configuration management with schema validation
- `src/handlers/` - MCP protocol handlers
- `src/providers/` - Model provider implementations
- `src/utils/` - Shared utilities for streaming and error handling

## Configuration Storage

Ultra MCP stores configuration in your system's default config directory:
- **macOS**: `~/Library/Preferences/ultra-mcp-nodejs/`
- **Linux**: `~/.config/ultra-mcp/`
- **Windows**: `%APPDATA%\ultra-mcp-nodejs\`

## Environment Variables

You can also set API keys via environment variables:
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `AZURE_API_KEY`
- `AZURE_ENDPOINT`

*Note: Configuration file takes precedence over environment variables.*

## Roadmap

### Phase 1: Zero Config Setup
- Interactive mode for seamless first-time setup
- Auto-detection of available API keys
- Smart defaults and configuration recommendations
- One-command installation and setup

### Phase 2: Integration Helpers
- Helper commands to integrate Ultra MCP into Claude Code
- Cursor IDE integration utilities
- Auto-generation of MCP server configuration files
- Integration validation and troubleshooting tools

### Phase 3: Cost Dashboard & Analytics
- Web UI dashboard using React, shadcn/ui, and Tremor
- SQLite database for usage tracking via Drizzle ORM
- Real-time cost monitoring and budget alerts
- Usage analytics and model performance insights
- Export capabilities for billing and reporting

### Phase 4: Workflow Optimization
- Use Ultra MCP to 100x your current LLM coding workflows
- Advanced prompt templates and automation
- Multi-model orchestration and fallback strategies
- Workflow optimization recommendations
- Performance monitoring and optimization tools

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m "Add feature"`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Google** for the [Agent2Agent (A2A) Protocol](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) inspiring agent interoperability
- **BeehiveInnovations** for [Zen MCP](https://github.com/BeehiveInnovations/zen-mcp-server) demonstrating AI model orchestration
- **Anthropic** for the [Model Context Protocol](https://modelcontextprotocol.io/)
- **Vercel** for the excellent [AI SDK](https://sdk.vercel.ai/)

## About the Author

👋 **Mike Chong** - Building tools to amplify human potential through AI.

As one of the earliest **users** of GitHub Copilot (personally invited by Nat Friedman, former GitHub CEO), I've witnessed firsthand how AI-assisted development can transform the way we build software. My journey as a former engineer on **Outlook iOS/Android** taught me the importance of creating tools that genuinely improve people's daily lives.

**Ultra MCP** represents my vision of democratizing access to the best AI models, making cutting-edge AI capabilities accessible to every developer through a unified, simple interface. I believe that by removing barriers between developers and AI models, we can accelerate innovation and create a better world for everyone.

*"The future belongs to those who can seamlessly orchestrate human creativity with AI capabilities."*

## Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Agent2Agent Protocol](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Zen MCP Server](https://github.com/BeehiveInnovations/zen-mcp-server)
- [Claude Code](https://claude.ai/code)
- [Cursor IDE](https://cursor.sh/)