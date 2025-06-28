import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getApiKey(): Promise<string> {
    const config = await this.configManager.getConfig();
    const apiKey = config.google?.apiKey || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error("Google API key not configured. Run 'ultra config' or set GOOGLE_API_KEY environment variable.");
    }
    
    return apiKey;
  }

  getDefaultModel(): string {
    return "gemini-2.5-pro"; // Default to Gemini 2.5 Pro as requested
  }

  listModels(): string[] {
    // Only list Gemini 2.5 Pro as per requirements
    return [
      "gemini-2.5-pro",
    ];
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const apiKey = await this.getApiKey();
    const model = request.model || this.getDefaultModel();
    
    // Enable Google Search by default for Gemini 2.5 Pro
    const useSearchGrounding = request.useSearchGrounding !== undefined 
      ? request.useSearchGrounding 
      : model === "gemini-2.5-pro";

    const google = createGoogleGenerativeAI({ apiKey });
    const modelInstance = google(model, { useSearchGrounding });
    
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

    const result = await generateText(options);

    return {
      text: result.text,
      model: model,
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
      metadata: {
        ...result.experimental_providerMetadata,
        searchGroundingEnabled: useSearchGrounding,
      },
    };
  }

  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const apiKey = await this.getApiKey();
    const model = request.model || this.getDefaultModel();
    
    const useSearchGrounding = request.useSearchGrounding !== undefined 
      ? request.useSearchGrounding 
      : model === "gemini-2.5-pro";

    const google = createGoogleGenerativeAI({ apiKey });
    const modelInstance = google(model, { useSearchGrounding });
    
    const options: any = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    };

    if (request.systemPrompt) {
      options.system = request.systemPrompt;
    }

    const result = await streamText(options);

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}