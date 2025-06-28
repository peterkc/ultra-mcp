import { z } from "zod";
import { ProviderManager } from "../providers/manager.js";
import { AIRequestSchema } from "../providers/types.js";

// Schema for the deep-reasoning tool
const DeepReasoningSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure"]).describe("AI provider to use"),
  prompt: z.string().describe("The complex question or problem requiring deep reasoning"),
  model: z.string().optional().describe("Specific model to use (optional, will use provider default)"),
  temperature: z.number().min(0).max(2).optional().default(0.7).describe("Temperature for response generation"),
  maxTokens: z.number().positive().optional().describe("Maximum tokens in response"),
  systemPrompt: z.string().optional().describe("System prompt to set context for reasoning"),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional().default("high").describe("Reasoning effort level (for O3 models)"),
  enableSearch: z.boolean().optional().default(true).describe("Enable Google Search for Gemini models"),
});

// Schema for the investigation tool
const InvestigationSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure"]).describe("AI provider to use"),
  topic: z.string().describe("The topic or question to investigate"),
  depth: z.enum(["shallow", "medium", "deep"]).default("deep").describe("Investigation depth"),
  model: z.string().optional().describe("Specific model to use"),
  enableSearch: z.boolean().optional().default(true).describe("Enable web search for investigation (Gemini only)"),
});

// Schema for the research tool
const ResearchSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure"]).describe("AI provider to use"),
  query: z.string().describe("Research query or topic"),
  sources: z.array(z.string()).optional().describe("Specific sources or contexts to consider"),
  model: z.string().optional().describe("Specific model to use"),
  outputFormat: z.enum(["summary", "detailed", "academic"]).default("detailed").describe("Output format for research"),
});

export class AIToolHandlers {
  private providerManager: ProviderManager;

  constructor(providerManager: ProviderManager) {
    this.providerManager = providerManager;
  }

  async handleDeepReasoning(params: z.infer<typeof DeepReasoningSchema>) {
    const provider = this.providerManager.getProvider(params.provider);
    
    // Build a comprehensive system prompt for deep reasoning
    const systemPrompt = params.systemPrompt || `You are an expert AI assistant specializing in deep reasoning and complex problem-solving. 
    Approach problems systematically, consider multiple perspectives, and provide thorough, well-reasoned responses.
    Break down complex problems into components, analyze each thoroughly, and synthesize insights.`;

    const response = await provider.generateText({
      prompt: params.prompt,
      model: params.model,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      systemPrompt,
      reasoningEffort: params.reasoningEffort,
      useSearchGrounding: params.provider === "gemini" ? params.enableSearch : false,
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: params.provider,
        model: response.model,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleInvestigation(params: z.infer<typeof InvestigationSchema>) {
    const provider = this.providerManager.getProvider(params.provider);
    
    // Build investigation prompts based on depth
    const depthPrompts = {
      shallow: "Provide a brief overview and key points about",
      medium: "Investigate and analyze the following topic, covering main aspects and implications",
      deep: "Conduct a thorough investigation of the following topic, exploring all relevant angles, implications, evidence, and potential conclusions. Be comprehensive and systematic",
    };

    const systemPrompt = `You are an expert investigator and analyst. Your task is to thoroughly investigate topics, 
    gather relevant information, analyze patterns, and provide comprehensive insights. 
    ${params.provider === "gemini" && params.enableSearch ? "Use web search to find current and relevant information." : ""}`;

    const prompt = `${depthPrompts[params.depth]}: ${params.topic}`;

    const response = await provider.generateText({
      prompt,
      model: params.model,
      systemPrompt,
      reasoningEffort: params.provider === "openai" || params.provider === "azure" ? "high" : undefined,
      useSearchGrounding: params.provider === "gemini" ? params.enableSearch : false,
      temperature: 0.5, // Lower temperature for investigation
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: params.provider,
        model: response.model,
        investigationDepth: params.depth,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleResearch(params: z.infer<typeof ResearchSchema>) {
    const provider = this.providerManager.getProvider(params.provider);
    
    // Build research prompts based on output format
    const formatInstructions = {
      summary: "Provide a concise summary of key findings and insights.",
      detailed: "Provide a comprehensive analysis with detailed findings, evidence, and conclusions.",
      academic: "Present findings in an academic format with clear structure, citations where possible, and scholarly analysis.",
    };

    const systemPrompt = `You are an expert researcher with deep knowledge across multiple domains. 
    Your task is to conduct thorough research, analyze information critically, and present findings clearly.
    ${params.sources ? `Consider these specific sources or contexts: ${params.sources.join(", ")}` : ""}
    ${formatInstructions[params.outputFormat]}`;

    const response = await provider.generateText({
      prompt: `Research the following: ${params.query}`,
      model: params.model,
      systemPrompt,
      reasoningEffort: params.provider === "openai" || params.provider === "azure" ? "high" : undefined,
      useSearchGrounding: params.provider === "gemini", // Always enable search for research with Gemini
      temperature: 0.4, // Lower temperature for research accuracy
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: params.provider,
        model: response.model,
        outputFormat: params.outputFormat,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleListModels() {
    const availableModels = this.providerManager.getAvailableModels();
    const configuredProviders = await this.providerManager.getConfiguredProviders();

    let response = "## Available AI Models\n\n";
    
    for (const [provider, models] of Object.entries(availableModels)) {
      const isConfigured = configuredProviders.includes(provider);
      response += `### ${provider.charAt(0).toUpperCase() + provider.slice(1)} ${isConfigured ? "✅" : "❌"}\n`;
      
      if (models.length > 0) {
        response += models.map(model => `- ${model}`).join("\n");
      } else {
        response += "- Not configured";
      }
      response += "\n\n";
    }

    response += `\n## Default Models\n`;
    response += `- OpenAI/Azure: o3 (optimized for reasoning)\n`;
    response += `- Gemini: gemini-2.5-pro (with Google Search enabled)\n`;

    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  getToolDefinitions() {
    return [
      {
        name: "deep-reasoning",
        description: "Use advanced AI models for deep reasoning and complex problem-solving. Supports O3 models for OpenAI/Azure and Gemini 2.5 Pro with Google Search.",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              description: "AI provider to use",
            },
            prompt: {
              type: "string",
              description: "The complex question or problem requiring deep reasoning",
            },
            model: {
              type: "string",
              description: "Specific model to use (optional, will use provider default)",
            },
            temperature: {
              type: "number",
              minimum: 0,
              maximum: 2,
              default: 0.7,
              description: "Temperature for response generation",
            },
            maxTokens: {
              type: "number",
              description: "Maximum tokens in response",
            },
            systemPrompt: {
              type: "string",
              description: "System prompt to set context for reasoning",
            },
            reasoningEffort: {
              type: "string",
              enum: ["low", "medium", "high"],
              default: "high",
              description: "Reasoning effort level (for O3 models)",
            },
            enableSearch: {
              type: "boolean",
              default: true,
              description: "Enable Google Search for Gemini models",
            },
          },
          required: ["provider", "prompt"],
        },
      },
      {
        name: "investigate",
        description: "Investigate topics thoroughly using AI models with configurable depth. Ideal for exploring subjects, gathering insights, and understanding complex topics.",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              description: "AI provider to use",
            },
            topic: {
              type: "string",
              description: "The topic or question to investigate",
            },
            depth: {
              type: "string",
              enum: ["shallow", "medium", "deep"],
              default: "deep",
              description: "Investigation depth",
            },
            model: {
              type: "string",
              description: "Specific model to use",
            },
            enableSearch: {
              type: "boolean",
              default: true,
              description: "Enable web search for investigation (Gemini only)",
            },
          },
          required: ["provider", "topic"],
        },
      },
      {
        name: "research",
        description: "Conduct comprehensive research using AI models. Supports multiple output formats and can consider specific sources or contexts.",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              description: "AI provider to use",
            },
            query: {
              type: "string",
              description: "Research query or topic",
            },
            sources: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Specific sources or contexts to consider",
            },
            model: {
              type: "string",
              description: "Specific model to use",
            },
            outputFormat: {
              type: "string",
              enum: ["summary", "detailed", "academic"],
              default: "detailed",
              description: "Output format for research",
            },
          },
          required: ["provider", "query"],
        },
      },
      {
        name: "list-ai-models",
        description: "List all available AI models and their configuration status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];
  }
}