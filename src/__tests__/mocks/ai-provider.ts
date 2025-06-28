import { AIProvider, AIRequest, AIResponse } from '../../providers/types.js';

export class MockAIProvider implements AIProvider {
  name: string;
  private responses: Map<string, AIResponse> = new Map();
  private streamResponses: Map<string, string[]> = new Map();
  private shouldThrowError: boolean = false;
  private errorMessage: string = 'Mock provider error';

  constructor(name: string = 'mock') {
    this.name = name;
  }

  getDefaultModel(): string {
    return 'mock-model';
  }

  listModels(): string[] {
    return ['mock-model', 'test-model'];
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }

    const key = `${request.prompt}-${request.model || 'default'}`;
    const mockResponse = this.responses.get(key);
    
    if (mockResponse) {
      return mockResponse;
    }

    return {
      text: `Mock response for: ${request.prompt}`,
      model: request.model || this.getDefaultModel(),
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }

  async *streamText(request: AIRequest): AsyncGenerator<string, void, unknown> {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }

    const key = `${request.prompt}-${request.model || 'default'}`;
    const chunks = this.streamResponses.get(key);
    
    if (chunks) {
      for (const chunk of chunks) {
        yield chunk;
      }
    } else {
      const words = `Mock streaming response for: ${request.prompt}`.split(' ');
      for (const word of words) {
        yield word + ' ';
      }
    }
  }

  // Mock helper methods
  setResponse(prompt: string, response: AIResponse, model?: string): void {
    const key = `${prompt}-${model || 'default'}`;
    this.responses.set(key, response);
  }

  setStreamResponse(prompt: string, chunks: string[], model?: string): void {
    const key = `${prompt}-${model || 'default'}`;
    this.streamResponses.set(key, chunks);
  }

  setShouldThrowError(shouldThrow: boolean, message?: string): void {
    this.shouldThrowError = shouldThrow;
    if (message) {
      this.errorMessage = message;
    }
  }

  reset(): void {
    this.responses.clear();
    this.streamResponses.clear();
    this.shouldThrowError = false;
    this.errorMessage = 'Mock provider error';
  }
}