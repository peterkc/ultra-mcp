import { createAzure } from "@ai-sdk/azure";
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types.js";
import { ConfigManager } from "../config/manager.js";

export class AzureOpenAIProvider implements AIProvider {
  name = "azure";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getCredentials(): Promise<{ apiKey: string; endpoint: string }> {
    const config = await this.configManager.getConfig();
    const apiKey = config.azure?.apiKey || process.env.AZURE_API_KEY;
    const endpoint = config.azure?.endpoint || process.env.AZURE_ENDPOINT;
    
    if (!apiKey || !endpoint) {
      throw new Error("Azure OpenAI credentials not configured. Run 'ultra config' or set AZURE_API_KEY and AZURE_ENDPOINT environment variables.");
    }
    
    return { apiKey, endpoint };
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
    const { apiKey, endpoint } = await this.getCredentials();
    const model = request.model || this.getDefaultModel();
    
    const azure = createAzure({ 
      apiKey,
      baseURL: endpoint,
    });
    const modelInstance = azure(model);
    
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
    const { apiKey, endpoint } = await this.getCredentials();
    const model = request.model || this.getDefaultModel();
    
    const azure = createAzure({ 
      apiKey,
      baseURL: endpoint,
    });
    const modelInstance = azure(model);
    
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