import { vi } from 'vitest';
import { EventEmitter } from 'events';

export class MockStdioServerTransport extends EventEmitter {
  private _handlers = new Map<string, any>();

  constructor() {
    super();
  }

  start() {
    return Promise.resolve();
  }

  send(message: any) {
    this.emit('send', message);
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }

  // Helper method for tests to simulate incoming messages
  simulateMessage(message: any) {
    this.emit('message', message);
  }

  // Helper to get sent messages in tests
  getSentMessages(): any[] {
    return [];
  }
}

export const createMockTransport = () => new MockStdioServerTransport();