import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getUsageStats, getUsageByDateRange, getProviderStats } from '../../../db/queries';

export const statsRouter = router({
  overview: publicProcedure.query(async () => {
    const stats = await getUsageStats();
    const providerStats = await getProviderStats();
    
    return {
      totalRequests: stats.totalRequests,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost,
      byProvider: providerStats,
      last30Days: await getUsageByDateRange(30),
    };
  }),

  usage: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        provider: z.string().optional(),
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, provider, limit, offset } = input;
      const { getDetailedUsage } = await import('../../../db/queries');
      
      const result = await getDetailedUsage({
        startDate,
        endDate,
        provider,
        limit,
        offset,
      });
      
      return {
        data: result.data,
        total: result.total,
        limit,
        offset,
      };
    }),

  export: publicProcedure
    .input(
      z.object({
        format: z.enum(['csv', 'json']),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement export functionality
      return {
        success: true,
        filename: `usage-export.${input.format}`,
        data: '',
      };
    }),
});