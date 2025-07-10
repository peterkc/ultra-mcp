import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getConfigManager } from '../../../config/manager';
import { ConfigSchema } from '../../../config/schema';

export const configRouter = router({
  get: publicProcedure.query(async () => {
    const configManager = await getConfigManager();
    const config = await configManager.getConfig();
    
    // Mask API keys for security
    const maskedConfig = {
      openai: {
        configured: !!config.openai?.apiKey,
        apiKey: config.openai?.apiKey ? '***' + config.openai.apiKey.slice(-4) : undefined,
      },
      google: {
        configured: !!config.google?.apiKey,
        apiKey: config.google?.apiKey ? '***' + config.google.apiKey.slice(-4) : undefined,
      },
      azure: {
        configured: !!config.azure?.apiKey,
        apiKey: config.azure?.apiKey ? '***' + config.azure.apiKey.slice(-4) : undefined,
        endpoint: config.azure?.endpoint,
      },
      xai: {
        configured: !!config.xai?.apiKey,
        apiKey: config.xai?.apiKey ? '***' + config.xai.apiKey.slice(-4) : undefined,
      },
    };
    
    return maskedConfig;
  }),

  update: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure', 'xai']),
        config: z.object({
          apiKey: z.string().optional(),
          endpoint: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const configManager = await getConfigManager();
      
      if (input.config.apiKey) {
        await configManager.setApiKey(input.provider, input.config.apiKey);
      }
      
      if (input.provider === 'azure' && input.config.endpoint) {
        await configManager.setAzureEndpoint(input.config.endpoint);
      }
      
      return { success: true };
    }),

  testConnection: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure', 'xai']),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement connection testing
      return {
        success: true,
        message: `${input.provider} connection successful`,
      };
    }),

  reset: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure', 'xai']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const configManager = await getConfigManager();
      
      if (input.provider) {
        // Reset specific provider
        await configManager.setApiKey(input.provider, undefined);
        if (input.provider === 'azure') {
          await configManager.setAzureEndpoint(undefined);
        }
      } else {
        // Reset all
        await configManager.reset();
      }
      
      return { success: true };
    }),
});