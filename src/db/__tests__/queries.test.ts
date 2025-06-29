import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsageStats, getProviderStats, getUsageByDateRange } from '../queries';
import * as connectionModule from '../connection';

// Mock the database connection
vi.mock('../connection', () => ({
  getDatabase: vi.fn(),
}));

describe('Database Queries', () => {
  let mockDb: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock database
    mockDb = {
      select: vi.fn(() => mockDb),
      from: vi.fn(() => mockDb),
      where: vi.fn(() => mockDb),
      groupBy: vi.fn(() => mockDb),
      orderBy: vi.fn(() => mockDb),
      limit: vi.fn(() => mockDb),
      offset: vi.fn(() => mockDb),
    };
    
    vi.mocked(connectionModule.getDatabase).mockResolvedValue(mockDb);
  });

  describe('getUsageStats', () => {
    it('should return aggregated usage statistics', async () => {
      mockDb.where.mockResolvedValue([
        {
          totalRequests: 100n,
          totalTokens: 50000n,
          totalCost: 25.5,
        },
      ]);

      const result = await getUsageStats();

      expect(result).toEqual({
        totalRequests: 100,
        totalTokens: 50000,
        totalCost: 25.5,
      });
    });

    it('should handle empty results', async () => {
      mockDb.where.mockResolvedValue([{}]);

      const result = await getUsageStats();

      expect(result).toEqual({
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
      });
    });
  });

  describe('getProviderStats', () => {
    it('should return stats grouped by provider', async () => {
      mockDb.groupBy.mockResolvedValue([
        { provider: 'openai', totalRequests: 50n, totalTokens: 25000n, totalCost: 15.0 },
        { provider: 'google', totalRequests: 30n, totalTokens: 15000n, totalCost: 8.0 },
        { provider: 'azure', totalRequests: 20n, totalTokens: 10000n, totalCost: 2.5 },
      ]);

      const result = await getProviderStats();

      expect(result).toEqual([
        { provider: 'openai', totalRequests: 50, totalTokens: 25000, totalCost: 15.0 },
        { provider: 'google', totalRequests: 30, totalTokens: 15000, totalCost: 8.0 },
        { provider: 'azure', totalRequests: 20, totalTokens: 10000, totalCost: 2.5 },
      ]);
    });

    it('should handle empty results', async () => {
      mockDb.groupBy.mockResolvedValue([]);

      const result = await getProviderStats();

      expect(result).toEqual([]);
    });
  });

  describe('getUsageByDateRange', () => {
    it('should return usage data for the last N days', async () => {
      const mockData = [
        { date: '2024-01-01', requests: 10n, tokens: 1000n, cost: 1.0 },
        { date: '2024-01-02', requests: 20n, tokens: 2000n, cost: 2.0 },
        { date: '2024-01-03', requests: 30n, tokens: 3000n, cost: 3.0 },
      ];
      
      mockDb.orderBy.mockResolvedValue(mockData);

      const result = await getUsageByDateRange(30);

      expect(result).toEqual([
        { date: '2024-01-01', requests: 10, tokens: 1000, cost: 1.0 },
        { date: '2024-01-02', requests: 20, tokens: 2000, cost: 2.0 },
        { date: '2024-01-03', requests: 30, tokens: 3000, cost: 3.0 },
      ]);
    });

    it('should handle different day ranges', async () => {
      mockDb.orderBy.mockResolvedValue([]);

      const result7Days = await getUsageByDateRange(7);
      const result90Days = await getUsageByDateRange(90);

      expect(result7Days).toEqual([]);
      expect(result90Days).toEqual([]);
    });
  });
});