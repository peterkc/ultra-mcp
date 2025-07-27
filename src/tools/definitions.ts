import { z } from "zod";
import { zodToJsonSchema } from "../utils/zod-to-json-schema";

// Import all schemas from ai-tools
export const DeepReasoningSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise OpenAI)"),
  prompt: z.string().describe("The complex question or problem requiring deep reasoning"),
  model: z.string().optional().describe("Specific model to use (optional, will use provider default)"),
  temperature: z.number().min(0).max(2).optional().default(0.7).describe("Temperature for response generation"),
  maxTokens: z.number().positive().optional().describe("Maximum tokens in response"),
  systemPrompt: z.string().optional().describe("System prompt to set context for reasoning"),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional().default("high").describe("Reasoning effort level (for O3 models)"),
  enableSearch: z.boolean().optional().default(true).describe("Enable Google Search for Gemini models"),
});

export const InvestigationSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise best available)"),
  topic: z.string().describe("The topic or question to investigate"),
  depth: z.enum(["shallow", "medium", "deep"]).default("deep").describe("Investigation depth"),
  model: z.string().optional().describe("Specific model to use"),
  enableSearch: z.boolean().optional().default(true).describe("Enable web search for investigation (Gemini only)"),
});

export const ResearchSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise best available)"),
  query: z.string().describe("Research query or topic"),
  sources: z.array(z.string()).optional().describe("Specific sources or contexts to consider"),
  model: z.string().optional().describe("Specific model to use"),
  outputFormat: z.enum(["summary", "detailed", "academic"]).default("detailed").describe("Output format for research"),
});

export const AnalyzeCodeSchema = z.object({
  task: z.string().describe("What to analyze (e.g., 'analyze performance of user authentication', 'review database queries')"),
  files: z.array(z.string()).optional().describe("File paths to analyze (optional)"),
  focus: z.enum(["architecture", "performance", "security", "quality", "all"]).default("all").describe("Analysis focus area"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

export const ReviewCodeSchema = z.object({
  task: z.string().describe("What to review (e.g., 'review pull request changes', 'check for security issues')"),
  files: z.array(z.string()).optional().describe("File paths to review (optional)"),
  focus: z.enum(["bugs", "security", "performance", "style", "all"]).default("all").describe("Review focus area"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

export const DebugIssueSchema = z.object({
  task: z.string().describe("What to debug (e.g., 'fix login error', 'investigate memory leak')"),
  files: z.array(z.string()).optional().describe("Relevant file paths (optional)"),
  symptoms: z.string().optional().describe("Error symptoms or behavior observed"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

export const PlanFeatureSchema = z.object({
  task: z.string().describe("What to plan (e.g., 'add user profiles', 'implement payment system')"),
  requirements: z.string().optional().describe("Specific requirements or constraints"),
  scope: z.enum(["minimal", "standard", "comprehensive"]).default("standard").describe("Planning scope"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

export const GenerateDocsSchema = z.object({
  task: z.string().describe("What to document (e.g., 'API endpoints', 'setup instructions', 'code comments')"),
  files: z.array(z.string()).optional().describe("File paths to document (optional)"),
  format: z.enum(["markdown", "comments", "api-docs", "readme"]).default("markdown").describe("Documentation format"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

export const ChallengeSchema = z.object({
  prompt: z.string().describe("The user's message or statement to analyze critically. When manually invoked with 'challenge', exclude that prefix - just pass the actual content. For automatic invocations, pass the user's complete message unchanged."),
});

export const ConsensusSchema = z.object({
  proposal: z.string().describe("The proposal, idea, or decision to analyze from multiple perspectives"),
  models: z.array(z.object({
    model: z.string().describe("Model name to consult (e.g., 'gemini-pro', 'gpt-4', 'o3')"),
    stance: z.enum(["for", "against", "neutral"]).default("neutral").describe("Perspective stance for this model"),
    provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().describe("AI provider for this model")
  })).min(1).describe("List of models to consult with their stances"),
  files: z.array(z.string()).optional().describe("Relevant file paths for context (optional)"),
});

export const PlannerSchema = z.object({
  task: z.string().describe("The task or problem to plan. For the first step, describe the complete planning challenge in detail. For subsequent steps, provide the specific planning step content, revisions, or branch explorations."),
  stepNumber: z.number().min(1).describe("Current step number in the planning sequence (starts at 1)"),
  totalSteps: z.number().min(1).describe("Current estimate of total steps needed (can be adjusted as planning progresses)"),
  scope: z.enum(["minimal", "standard", "comprehensive"]).default("standard").describe("Planning scope and depth"),
  requirements: z.string().optional().describe("Specific requirements, constraints, or success criteria"),
  isRevision: z.boolean().optional().default(false).describe("True if this step revises a previous step"),
  revisingStep: z.number().optional().describe("If isRevision is true, which step number is being revised"),
  isBranching: z.boolean().optional().default(false).describe("True if exploring an alternative approach from a previous step"),
  branchingFrom: z.number().optional().describe("If isBranching is true, which step number to branch from"),
  branchId: z.string().optional().describe("Identifier for this planning branch (e.g., 'approach-A', 'microservices-path')"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use for planning assistance"),
});

export const PrecommitSchema = z.object({
  path: z.string().optional().describe("Starting path to search for git repositories (defaults to current directory)"),
  compareTo: z.string().optional().describe("Git ref (branch/tag/commit) to compare against. If not provided, checks staged and unstaged changes"),
  includeStaged: z.boolean().optional().default(true).describe("Include staged changes in validation"),
  includeUnstaged: z.boolean().optional().default(true).describe("Include unstaged changes in validation"),
  checks: z.array(z.enum(["tests", "lint", "types", "security", "all"])).optional().default(["all"]).describe("Validation checks to perform"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

export const SecauditSchema = z.object({
  task: z.string().describe("What to audit (e.g., 'audit authentication system', 'check for OWASP vulnerabilities')"),
  files: z.array(z.string()).optional().describe("File paths to audit (optional)"),
  scope: z.enum(["authentication", "authorization", "input-validation", "cryptography", "dependencies", "infrastructure", "all"]).default("all").describe("Security audit scope"),
  compliance: z.array(z.string()).optional().describe("Compliance standards to check (e.g., 'OWASP', 'PCI-DSS', 'HIPAA')"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

export const TracerSchema = z.object({
  target: z.string().describe("Function/method name or code element to trace (e.g., 'UserController.login', 'calculateTax()')"),
  mode: z.enum(["execution", "dependencies", "callers", "callees"]).default("execution").describe("Tracing mode"),
  depth: z.number().min(1).max(10).optional().default(3).describe("Maximum depth to trace"),
  includeTests: z.boolean().optional().default(false).describe("Include test files in trace"),
  provider: z.enum(["openai", "gemini", "azure", "grok"]).optional().default("gemini").describe("AI provider to use"),
});

// Tool definitions with proper JSON Schema
export const toolDefinitions = [
  {
    name: "deep-reasoning",
    description: "Use advanced AI models for deep reasoning and complex problem-solving. Supports O3 models for OpenAI/Azure and Gemini 2.5 Pro with Google Search.",
    inputSchema: zodToJsonSchema(DeepReasoningSchema)
  },
  {
    name: "investigate",
    description: "Investigate topics thoroughly with configurable depth",
    inputSchema: zodToJsonSchema(InvestigationSchema)
  },
  {
    name: "research",
    description: "Conduct comprehensive research with multiple output formats",
    inputSchema: zodToJsonSchema(ResearchSchema)
  },
  {
    name: "list-ai-models",
    description: "List all available AI models and their configuration status",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "analyze-code",
    description: "Analyze code for architecture, performance, security, or quality issues",
    inputSchema: zodToJsonSchema(AnalyzeCodeSchema)
  },
  {
    name: "review-code",
    description: "Review code for bugs, security issues, performance, or style problems",
    inputSchema: zodToJsonSchema(ReviewCodeSchema)
  },
  {
    name: "debug-issue",
    description: "Debug technical issues with systematic problem-solving approach",
    inputSchema: zodToJsonSchema(DebugIssueSchema)
  },
  {
    name: "plan-feature",
    description: "Plan feature implementation with step-by-step approach",
    inputSchema: zodToJsonSchema(PlanFeatureSchema)
  },
  {
    name: "generate-docs",
    description: "Generate documentation in various formats",
    inputSchema: zodToJsonSchema(GenerateDocsSchema)
  },
  {
    name: "challenge",
    description: "Challenge a statement or assumption with critical thinking",
    inputSchema: zodToJsonSchema(ChallengeSchema)
  },
  {
    name: "consensus",
    description: "Get consensus from multiple AI models on a proposal",
    inputSchema: zodToJsonSchema(ConsensusSchema)
  },
  {
    name: "planner",
    description: "Multi-step planning with revisions and branches",
    inputSchema: zodToJsonSchema(PlannerSchema)
  },
  {
    name: "precommit",
    description: "Pre-commit validation for code changes",
    inputSchema: zodToJsonSchema(PrecommitSchema)
  },
  {
    name: "secaudit",
    description: "Security audit for code and configurations",
    inputSchema: zodToJsonSchema(SecauditSchema)
  },
  {
    name: "tracer",
    description: "Trace execution flow and debug complex issues",
    inputSchema: zodToJsonSchema(TracerSchema)
  }
];