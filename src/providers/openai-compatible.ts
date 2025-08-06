import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, streamText } from "ai";
import { AIProvider, AIRequest, AIResponse } from "./types";
import { ConfigManager } from "../config/manager";
import { trackLLMRequest, updateLLMCompletion } from "../db/tracking";

export class OpenAICompatibleProvider implements AIProvider {
  name = "openai-compatible";
  private configManager: ConfigManager;
  
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  private async getCredentials(): Promise<{ 
    apiKey: string; 
    baseURL: string; 
    providerName: 'ollama' | 'openrouter';
    models?: string[] 
  }> {
    const config = await this.configManager.getConfig();
    const apiKey = config.openaiCompatible?.apiKey || "fake-key"; // Ollama doesn't need real key
    const baseURL = config.openaiCompatible?.baseURL || "http://localhost:11434/v1";
    const providerName = config.openaiCompatible?.providerName || 'ollama';
    const models = config.openaiCompatible?.models;

    if (!baseURL) {
      throw new Error("OpenAI-Compatible base URL not configured. Run 'ultra config' to set up the provider.");
    }

    // For OpenRouter, require real API key
    if (providerName === 'openrouter' && (!apiKey || apiKey === "fake-key")) {
      throw new Error("OpenRouter API key required. Run 'ultra config' or set OPENROUTER_API_KEY environment variable.");
    }

    return { apiKey, baseURL, providerName, models };
  }

  getDefaultModel(): string {
    return "llama3.1"; // Default to popular Ollama model
  }

  listModels(): string[] {
    // Default model lists - can be overridden by configuration
    const ollamaModels = [
      "llama3.1:8b",
      "llama3.1:70b", 
      "llama3.2:3b",
      "mistral:7b",
      "mistral-nemo:12b",
      "codellama:7b",
      "codellama:13b",
      "deepseek-r1:8b",
      "deepseek-coder:6.7b",
      "gemma2:9b",
      "gemma2:27b",
    ];

    const openrouterModels = [
      // OpenAI
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/o3-mini",
      // Anthropic
      "anthropic/claude-3-5-sonnet-20241022",
      "anthropic/claude-3-5-haiku-20241022",
      // Meta
      "meta-llama/llama-3.1-405b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
      "meta-llama/llama-3.1-8b-instruct",
      // Google
      "google/gemini-pro-1.5",
      "google/gemini-flash-1.5",
      // DeepSeek
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      // Mistral
      "mistralai/mistral-large",
      "mistralai/mixtral-8x7b-instruct",
    ];

    // Try to get configuration to determine provider
    try {
      // This is sync, so we can't await here. Return both lists for now.
      // The actual provider type will be determined at runtime.
      return [...ollamaModels, ...openrouterModels];
    } catch {
      return ollamaModels; // Default to Ollama models
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const { apiKey, baseURL, providerName } = await this.getCredentials();
    const model = request.model || this.getDefaultModel();
    const startTime = Date.now();

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'openai-compatible',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
        providerName,
        baseURL,
      },
      startTime,
    });

    const openaiCompatible = createOpenAICompatible({ 
      name: providerName,
      apiKey, 
      baseURL 
    });
    const modelInstance = openaiCompatible(model);
    
    const options = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      ...(request.systemPrompt && { system: request.systemPrompt }),
      onFinish: async (event: any) => {
        // Track completion using onFinish callback
        const usage = event.totalUsage ? {
          promptTokens: event.totalUsage.inputTokens || 0,
          completionTokens: event.totalUsage.outputTokens || 0,
          totalTokens: event.totalUsage.totalTokens || 0,
        } : undefined;
        
        await updateLLMCompletion({
          requestId,
          responseData: { text: event.text },
          usage,
          finishReason: event.finishReason,
          endTime: Date.now(),
        });
      },
    };

    try {
      const result = await generateText(options);

      return {
        text: result.text,
        model: model,
        usage: result.usage ? {
          promptTokens: result.usage.inputTokens || 0,
          completionTokens: result.usage.outputTokens || 0,
          totalTokens: result.usage.totalTokens || 0,
        } : undefined,
        metadata: {
          ...result.providerMetadata,
          providerName,
          baseURL,
        },
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
    const { apiKey, baseURL, providerName } = await this.getCredentials();
    const model = request.model || this.getDefaultModel();
    const startTime = Date.now();

    // Track the request
    const requestId = await trackLLMRequest({
      provider: 'openai-compatible',
      model: model,
      toolName: request.toolName,
      requestData: {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
        providerName,
        baseURL,
      },
      startTime,
    });

    const openaiCompatible = createOpenAICompatible({ 
      name: providerName,
      apiKey, 
      baseURL 
    });
    const modelInstance = openaiCompatible(model);
    
    const options = {
      model: modelInstance,
      prompt: request.prompt,
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      ...(request.systemPrompt && { system: request.systemPrompt }),
      onFinish: async (event: any) => {
        // Track completion using onFinish callback
        const usage = event.totalUsage ? {
          promptTokens: event.totalUsage.inputTokens || 0,
          completionTokens: event.totalUsage.outputTokens || 0,
          totalTokens: event.totalUsage.totalTokens || 0,
        } : undefined;
        
        await updateLLMCompletion({
          requestId,
          responseData: { text: event.text },
          usage,
          finishReason: event.finishReason,
          endTime: Date.now(),
        });
      },
    };

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
        error: error instanceof Error ? error.message : String(error),
        endTime: Date.now(),
      });
      throw error;
    }
  }
}