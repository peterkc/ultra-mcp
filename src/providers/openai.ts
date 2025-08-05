import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";
import { trackLLMRequest, updateLLMCompletion } from "../db/tracking";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getCredentials(): Promise<{ apiKey: string; baseURL?: string }> {
    const config = await this.configManager.getConfig();
    const apiKey = config.openai?.apiKey || process.env.OPENAI_API_KEY;
    const baseURL = config.openai?.baseURL || process.env.OPENAI_BASE_URL;

    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Run 'ultra config' or set OPENAI_API_KEY environment variable.");
    }

    return { apiKey, baseURL };
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
    const { apiKey, baseURL } = await this.getCredentials();
    const model = request.model || this.getDefaultModel();
    const startTime = Date.now();

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'openai',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
        reasoningEffort: request.reasoningEffort,
      },
      startTime,
    });

    const openai = createOpenAI({ apiKey, baseURL });
    const modelInstance = openai(model);
    
    type GenerateTextOptions = {
      model: typeof modelInstance;
      prompt: string;
      temperature?: number;
      maxOutputTokens?: number;
      system?: string;
      reasoningEffort?: 'low' | 'medium' | 'high';
      onFinish?: (result: {
        text: string;
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
        finishReason?: string;
      }) => Promise<void>;
    };

    const options: GenerateTextOptions = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      onFinish: async (result) => {
        // Track completion using onFinish callback
        await updateLLMCompletion({
          requestId,
          responseData: { text: result.text.text },
          usage: result.usage ? {
            inputTokens: result.usage.inputTokens || 0,
            outputTokens: result.usage.outputTokens || 0,
            totalTokens: result.usage.totalTokens || 0,
          } : undefined,
          finishReason: result.finishReason,
          endTime: Date.now(),
        });
      },
    };

    // Add system prompt if provided
    if (request.systemPrompt) {
      options.system = request.systemPrompt;
    }

    // Add reasoning effort for O3 models
    if (model.startsWith("o3") || model.startsWith("o1")) {
      options.reasoningEffort = request.reasoningEffort || "medium";
    }

    try {
      const result = await generateText(options);

      return {
        text: result.text.text,
        model: model,
        usage: result.usage ? {
          inputTokens: result.usage.inputTokens || 0,
          outputTokens: result.usage.outputTokens || 0,
          totalTokens: result.usage.totalTokens || 0,
        } : undefined,
        metadata: result.experimental_providerMetadata,
      };
    } catch (error) {
      // Track error
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now(),
      });
      throw error;
    }
  }

  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const { apiKey, baseURL } = await this.getCredentials();
    const model = request.model || this.getDefaultModel();
    const startTime = Date.now();

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'openai',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
        reasoningEffort: request.reasoningEffort,
      },
      startTime,
    });

    const openai = createOpenAI({ apiKey, baseURL });
    const modelInstance = openai(model);
    
    type StreamTextOptions = {
      model: typeof modelInstance;
      prompt: string;
      temperature?: number;
      maxOutputTokens?: number;
      system?: string;
      reasoningEffort?: 'low' | 'medium' | 'high';
      onFinish?: (result: {
        text: string;
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
        finishReason?: string;
      }) => Promise<void>;
    };

    const options: StreamTextOptions = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      onFinish: async (result) => {
        // Track completion using onFinish callback
        await updateLLMCompletion({
          requestId,
          responseData: { text: result.text.text },
          usage: result.usage ? {
            inputTokens: result.usage.inputTokens || 0,
            outputTokens: result.usage.outputTokens || 0,
            totalTokens: result.usage.totalTokens || 0,
          } : undefined,
          finishReason: result.finishReason,
          endTime: Date.now(),
        });
      },
    };

    if (request.systemPrompt) {
      options.system = request.systemPrompt;
    }

    if (model.startsWith("o3") || model.startsWith("o1")) {
      options.reasoningEffort = request.reasoningEffort || "medium";
    }

    try {
      const result = streamText(options);

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      // Track error
      await updateLLMCompletion({
        requestId,
        responseData: null,
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now(),
      });
      throw error;
    }
  }
}