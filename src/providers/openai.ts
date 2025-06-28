import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types.js";
import { ConfigManager } from "../config/manager.js";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getApiKey(): Promise<string> {
    const config = await this.configManager.getConfig();
    const apiKey = config.openai?.apiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Run 'ultra config' or set OPENAI_API_KEY environment variable.");
    }
    
    return apiKey;
  }

  getDefaultModel(): string {
    return "o3"; // Default to O3 as requested
  }

  listModels(): string[] {
    // Only list O3 model as per requirements
    return [
      "o3",
    ];
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const apiKey = await this.getApiKey();
    const model = request.model || this.getDefaultModel();
    
    const openai = createOpenAI({ apiKey });
    const modelInstance = openai(model);
    
    const options: any = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    };

    // Add system prompt if provided
    if (request.systemPrompt) {
      options.system = request.systemPrompt;
    }

    // Add reasoning effort for O3 models
    if (model.startsWith("o3") || model.startsWith("o1")) {
      options.reasoningEffort = request.reasoningEffort || "medium";
    }

    const result = await generateText(options);

    return {
      text: result.text,
      model: model,
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
      metadata: result.experimental_providerMetadata,
    };
  }

  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const apiKey = await this.getApiKey();
    const model = request.model || this.getDefaultModel();
    
    const openai = createOpenAI({ apiKey });
    const modelInstance = openai(model);
    
    const options: any = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    };

    if (request.systemPrompt) {
      options.system = request.systemPrompt;
    }

    if (model.startsWith("o3") || model.startsWith("o1")) {
      options.reasoningEffort = request.reasoningEffort || "medium";
    }

    const result = await streamText(options);

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}