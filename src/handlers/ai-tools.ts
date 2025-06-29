import { z } from "zod";
import { ProviderManager } from "../providers/manager";
import { AIRequestSchema } from "../providers/types";

// Schema for the deep-reasoning tool
const DeepReasoningSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise OpenAI)"),
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
  provider: z.enum(["openai", "gemini", "azure"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise best available)"),
  topic: z.string().describe("The topic or question to investigate"),
  depth: z.enum(["shallow", "medium", "deep"]).default("deep").describe("Investigation depth"),
  model: z.string().optional().describe("Specific model to use"),
  enableSearch: z.boolean().optional().default(true).describe("Enable web search for investigation (Gemini only)"),
});

// Schema for the research tool
const ResearchSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise best available)"),
  query: z.string().describe("Research query or topic"),
  sources: z.array(z.string()).optional().describe("Specific sources or contexts to consider"),
  model: z.string().optional().describe("Specific model to use"),
  outputFormat: z.enum(["summary", "detailed", "academic"]).default("detailed").describe("Output format for research"),
});

// Zen-inspired simplified tool schemas
const AnalyzeCodeSchema = z.object({
  task: z.string().describe("What to analyze (e.g., 'analyze performance of user authentication', 'review database queries')"),
  files: z.array(z.string()).optional().describe("File paths to analyze (optional)"),
  focus: z.enum(["architecture", "performance", "security", "quality", "all"]).default("all").describe("Analysis focus area"),
  provider: z.enum(["openai", "gemini", "azure"]).optional().default("gemini").describe("AI provider to use"),
});

const ReviewCodeSchema = z.object({
  task: z.string().describe("What to review (e.g., 'review pull request changes', 'check for security issues')"),
  files: z.array(z.string()).optional().describe("File paths to review (optional)"),
  focus: z.enum(["bugs", "security", "performance", "style", "all"]).default("all").describe("Review focus area"),
  provider: z.enum(["openai", "gemini", "azure"]).optional().default("openai").describe("AI provider to use"),
});

const DebugIssueSchema = z.object({
  task: z.string().describe("What to debug (e.g., 'fix login error', 'investigate memory leak')"),
  files: z.array(z.string()).optional().describe("Relevant file paths (optional)"),
  symptoms: z.string().optional().describe("Error symptoms or behavior observed"),
  provider: z.enum(["openai", "gemini", "azure"]).optional().default("openai").describe("AI provider to use"),
});

const PlanFeatureSchema = z.object({
  task: z.string().describe("What to plan (e.g., 'add user profiles', 'implement payment system')"),
  requirements: z.string().optional().describe("Specific requirements or constraints"),
  scope: z.enum(["minimal", "standard", "comprehensive"]).default("standard").describe("Planning scope"),
  provider: z.enum(["openai", "gemini", "azure"]).optional().default("gemini").describe("AI provider to use"),
});

const GenerateDocsSchema = z.object({
  task: z.string().describe("What to document (e.g., 'API endpoints', 'setup instructions', 'code comments')"),
  files: z.array(z.string()).optional().describe("File paths to document (optional)"),
  format: z.enum(["markdown", "comments", "api-docs", "readme"]).default("markdown").describe("Documentation format"),
  provider: z.enum(["openai", "gemini", "azure"]).optional().default("gemini").describe("AI provider to use"),
});

export class AIToolHandlers {
  private providerManager: ProviderManager;

  constructor(providerManager: ProviderManager) {
    this.providerManager = providerManager;
  }

  async handleDeepReasoning(params: z.infer<typeof DeepReasoningSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
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
      useSearchGrounding: providerName === "gemini" ? params.enableSearch : false,
      toolName: 'deep-reasoning',
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
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
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
      reasoningEffort: providerName === "openai" || providerName === "azure" ? "high" : undefined,
      useSearchGrounding: providerName === "gemini" ? params.enableSearch : false,
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
        provider: providerName,
        model: response.model,
        investigationDepth: params.depth,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleResearch(params: z.infer<typeof ResearchSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
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
      reasoningEffort: providerName === "openai" || providerName === "azure" ? "high" : undefined,
      useSearchGrounding: providerName === "gemini", // Always enable search for research with Gemini
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
        provider: providerName,
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

  // Zen-inspired simplified tool handlers
  async handleAnalyzeCode(params: z.infer<typeof AnalyzeCodeSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
    const focusPrompts = {
      architecture: "Focus on architectural patterns, design decisions, modularity, and code organization",
      performance: "Focus on performance implications, optimization opportunities, and efficiency concerns",
      security: "Focus on security vulnerabilities, authentication, authorization, and data protection",
      quality: "Focus on code quality, maintainability, readability, and best practices",
      all: "Provide comprehensive analysis covering architecture, performance, security, and quality aspects"
    };

    const systemPrompt = `You are an expert code analyst. Analyze the provided code or task systematically.
    ${focusPrompts[params.focus]}
    
    Provide insights on:
    - Key findings and patterns identified
    - Areas of concern or improvement opportunities  
    - Recommendations for enhancement
    - Technical assessment and conclusions
    
    Be specific and actionable in your analysis.`;

    const prompt = `Analyze the following: ${params.task}${params.files ? `\n\nFiles to consider: ${params.files.join(", ")}` : ""}`;

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.3, // Lower temperature for analytical tasks
      reasoningEffort: providerName === "openai" || providerName === "azure" ? "high" : undefined,
      useSearchGrounding: providerName === "gemini",
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        focus: params.focus,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleReviewCode(params: z.infer<typeof ReviewCodeSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
    const focusPrompts = {
      bugs: "Focus on identifying potential bugs, logic errors, and runtime issues",
      security: "Focus on security vulnerabilities, input validation, and secure coding practices",
      performance: "Focus on performance bottlenecks, inefficient algorithms, and optimization opportunities",
      style: "Focus on code style, formatting, naming conventions, and readability",
      all: "Provide comprehensive code review covering bugs, security, performance, and style"
    };

    const systemPrompt = `You are an expert code reviewer. Review the provided code thoroughly.
    ${focusPrompts[params.focus]}
    
    Provide detailed feedback on:
    - Issues found and their severity
    - Specific recommendations for improvement
    - Code quality assessment
    - Best practices and standards compliance
    
    Be constructive and specific in your review comments.`;

    const prompt = `Review the following: ${params.task}${params.files ? `\n\nFiles to review: ${params.files.join(", ")}` : ""}`;

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.2, // Very low temperature for code review accuracy
      reasoningEffort: providerName === "openai" || providerName === "azure" ? "high" : undefined,
      useSearchGrounding: false, // No search needed for code review
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        focus: params.focus,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleDebugIssue(params: z.infer<typeof DebugIssueSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
    const systemPrompt = `You are an expert debugger and problem solver. Help identify and solve technical issues.
    
    Approach debugging systematically:
    - Analyze the problem description and symptoms
    - Identify potential root causes
    - Suggest specific debugging steps
    - Provide solution recommendations
    - Consider edge cases and related issues
    
    Be methodical and provide actionable debugging guidance.`;

    let prompt = `Debug the following issue: ${params.task}`;
    if (params.symptoms) {
      prompt += `\n\nSymptoms observed: ${params.symptoms}`;
    }
    if (params.files) {
      prompt += `\n\nRelevant files: ${params.files.join(", ")}`;
    }

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.4, // Balanced temperature for debugging creativity
      reasoningEffort: providerName === "openai" || providerName === "azure" ? "high" : undefined,
      useSearchGrounding: false, // No search needed for debugging
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        symptoms: params.symptoms,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handlePlanFeature(params: z.infer<typeof PlanFeatureSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
    const scopePrompts = {
      minimal: "Provide a basic implementation plan with essential components only",
      standard: "Provide a detailed implementation plan with proper architecture and considerations",
      comprehensive: "Provide an extensive implementation plan with full architecture, testing, documentation, and deployment considerations"
    };

    const systemPrompt = `You are an expert software architect and project planner. Create detailed implementation plans for features.
    ${scopePrompts[params.scope]}
    
    Include in your plan:
    - Feature breakdown and components
    - Implementation steps and timeline
    - Technical considerations and dependencies
    - Testing and validation approach
    - Potential challenges and mitigation strategies
    
    Be practical and actionable in your planning.`;

    let prompt = `Plan the following feature: ${params.task}`;
    if (params.requirements) {
      prompt += `\n\nRequirements: ${params.requirements}`;
    }

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.6, // Moderate temperature for creative planning
      reasoningEffort: providerName === "openai" || providerName === "azure" ? "medium" : undefined,
      useSearchGrounding: providerName === "gemini",
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        scope: params.scope,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleGenerateDocs(params: z.infer<typeof GenerateDocsSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']);
    const provider = this.providerManager.getProvider(providerName);
    
    const formatPrompts = {
      markdown: "Generate documentation in markdown format with proper structure and formatting",
      comments: "Generate inline code comments and docstrings for the specified code",
      "api-docs": "Generate API documentation with endpoints, parameters, responses, and examples",
      readme: "Generate README documentation with setup, usage, and project information"
    };

    const systemPrompt = `You are an expert technical writer and documentation specialist.
    ${formatPrompts[params.format]}
    
    Create comprehensive documentation that:
    - Is clear and easy to understand
    - Follows proper formatting and structure
    - Includes relevant examples and usage
    - Covers all important aspects
    - Is practical and actionable
    
    Ensure documentation is professional and user-friendly.`;

    let prompt = `Generate documentation for: ${params.task}`;
    if (params.files) {
      prompt += `\n\nFiles to document: ${params.files.join(", ")}`;
    }

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.5, // Balanced temperature for documentation clarity
      useSearchGrounding: providerName === "gemini",
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        format: params.format,
        usage: response.usage,
        ...response.metadata,
      },
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
              description: "AI provider to use (defaults to Azure if configured, otherwise best available)",
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
          required: ["prompt"],
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
              description: "AI provider to use (defaults to Azure if configured, otherwise best available)",
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
          required: ["topic"],
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
              description: "AI provider to use (defaults to Azure if configured, otherwise best available)",
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
          required: ["query"],
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
      // Zen-inspired simplified tools
      {
        name: "analyze-code",
        description: "Analyze code for architecture, performance, security, or quality issues. Simplified zen-inspired tool for systematic code analysis.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to analyze (e.g., 'analyze performance of user authentication', 'review database queries')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "File paths to analyze (optional)",
            },
            focus: {
              type: "string",
              enum: ["architecture", "performance", "security", "quality", "all"],
              default: "all",
              description: "Analysis focus area",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "review-code",
        description: "Review code for bugs, security issues, performance, or style problems. Simplified zen-inspired tool for systematic code review.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to review (e.g., 'review pull request changes', 'check for security issues')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "File paths to review (optional)",
            },
            focus: {
              type: "string",
              enum: ["bugs", "security", "performance", "style", "all"],
              default: "all",
              description: "Review focus area",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              default: "openai",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "debug-issue",
        description: "Debug technical issues with systematic problem-solving approach. Simplified zen-inspired tool for guided debugging.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to debug (e.g., 'fix login error', 'investigate memory leak')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "Relevant file paths (optional)",
            },
            symptoms: {
              type: "string",
              description: "Error symptoms or behavior observed",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              default: "openai",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "plan-feature",
        description: "Plan feature implementation with step-by-step approach. Simplified zen-inspired tool for systematic feature planning.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to plan (e.g., 'add user profiles', 'implement payment system')",
            },
            requirements: {
              type: "string",
              description: "Specific requirements or constraints",
            },
            scope: {
              type: "string",
              enum: ["minimal", "standard", "comprehensive"],
              default: "standard",
              description: "Planning scope",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "generate-docs",
        description: "Generate documentation in various formats (markdown, comments, API docs, README). Simplified zen-inspired tool for documentation creation.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to document (e.g., 'API endpoints', 'setup instructions', 'code comments')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "File paths to document (optional)",
            },
            format: {
              type: "string",
              enum: ["markdown", "comments", "api-docs", "readme"],
              default: "markdown",
              description: "Documentation format",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
    ];
  }
}