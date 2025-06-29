import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";
import { trackLLMRequest, updateLLMCompletion } from "../db/tracking";

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
    const startTime = Date.now();
    
    // Enable Google Search by default for Gemini 2.5 Pro
    const useSearchGrounding = request.useSearchGrounding !== undefined 
      ? request.useSearchGrounding 
      : model === "gemini-2.5-pro";

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'gemini',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        useSearchGrounding,
      },
      startTime,
    });

    const google = createGoogleGenerativeAI({ apiKey });
    const modelInstance = google(model, { useSearchGrounding });
    
    const options: any = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      onFinish: async (result) => {
        // Track completion using onFinish callback
        await updateLLMCompletion({
          requestId,
          responseData: { text: result.text },
          usage: result.usage,
          finishReason: result.finishReason,
          endTime: Date.now(),
        });
      },
    };

    // Add system prompt if provided
    if (request.systemPrompt) {
      options.system = request.systemPrompt;
    }

    try {
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
    } catch (error) {
      // Track error
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: error.message,
        endTime: Date.now(),
      });
      throw error;
    }
  }

  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const apiKey = await this.getApiKey();
    const model = request.model || this.getDefaultModel();
    const startTime = Date.now();
    
    const useSearchGrounding = request.useSearchGrounding !== undefined 
      ? request.useSearchGrounding 
      : model === "gemini-2.5-pro";

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'gemini',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        useSearchGrounding,
      },
      startTime,
    });

    const google = createGoogleGenerativeAI({ apiKey });
    const modelInstance = google(model, { useSearchGrounding });
    
    const options: any = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      onFinish: async (result) => {
        // Track completion using onFinish callback
        await updateLLMCompletion({
          requestId,
          responseData: { text: result.text },
          usage: result.usage,
          finishReason: result.finishReason,
          endTime: Date.now(),
        });
      },
    };

    if (request.systemPrompt) {
      options.system = request.systemPrompt;
    }

    try {
      const result = await streamText(options);

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      // Track error
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: error.message,
        endTime: Date.now(),
      });
      throw error;
    }
  }
}