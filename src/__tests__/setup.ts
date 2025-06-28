import { vi, afterEach } from 'vitest';

// Mock console.error to avoid cluttering test output
global.console.error = vi.fn();

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});