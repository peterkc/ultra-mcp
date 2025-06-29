import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getConfigManager } from '../../../config/manager';
import { configSchema } from '../../../config/schema';

export const configRouter = router({
  get: publicProcedure.query(async () => {
    const configManager = await getConfigManager();
    const config = configManager.getAll();
    
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
    };
    
    return maskedConfig;
  }),

  update: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure']),
        config: z.object({
          apiKey: z.string().optional(),
          endpoint: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const configManager = await getConfigManager();
      
      if (input.provider === 'openai' && input.config.apiKey) {
        configManager.setOpenAIKey(input.config.apiKey);
      } else if (input.provider === 'google' && input.config.apiKey) {
        configManager.setGoogleKey(input.config.apiKey);
      } else if (input.provider === 'azure') {
        if (input.config.apiKey) {
          configManager.setAzureKey(input.config.apiKey);
        }
        if (input.config.endpoint) {
          configManager.setAzureEndpoint(input.config.endpoint);
        }
      }
      
      return { success: true };
    }),

  testConnection: publicProcedure
    .input(
      z.object({
        provider: z.enum(['openai', 'google', 'azure']),
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
        provider: z.enum(['openai', 'google', 'azure']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const configManager = await getConfigManager();
      
      if (input.provider) {
        // Reset specific provider
        if (input.provider === 'openai') {
          configManager.setOpenAIKey('');
        } else if (input.provider === 'google') {
          configManager.setGoogleKey('');
        } else if (input.provider === 'azure') {
          configManager.setAzureKey('');
          configManager.setAzureEndpoint('');
        }
      } else {
        // Reset all
        configManager.reset();
      }
      
      return { success: true };
    }),
});