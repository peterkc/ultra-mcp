import { vi, afterEach } from 'vitest';

// Make vi globally available for mock hoisting
globalThis.vi = vi;

// Mock console.error to avoid cluttering test output
global.console.error = vi.fn();

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});