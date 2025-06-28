import { runChatWithDeps } from './chat-injectable';

interface ChatOptions {
  model?: string;
  provider?: string;
}

export async function runChat(options: ChatOptions = {}): Promise<void> {
  return runChatWithDeps(options);
}

// Re-export for testing
export { runChatWithDeps };