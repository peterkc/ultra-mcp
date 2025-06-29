import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { getConfigManager } from '../../../config/manager';
import { ProviderManager } from '../../../providers/manager';

export const modelsRouter = router({
  list: publicProcedure.query(async () => {
    const configManager = await getConfigManager();
    const config = await configManager.getConfig();
    const providerManager = new ProviderManager(config);
    
    const models = [];
    
    // OpenAI models
    if (config.openai?.apiKey) {
      models.push(
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Most capable model' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Faster, cheaper' },
        { id: 'o1', name: 'O1', provider: 'openai', description: 'Advanced reasoning' },
        { id: 'o1-mini', name: 'O1 Mini', provider: 'openai', description: 'Efficient reasoning' },
        { id: 'o3-mini', name: 'O3 Mini', provider: 'openai', description: 'Latest reasoning model' },
      );
    }
    
    // Google models
    if (config.google?.apiKey) {
      models.push(
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Fast multimodal' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'Advanced capabilities' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', description: 'Fast and efficient' },
      );
    }
    
    // Azure models
    if (config.azure?.apiKey) {
      models.push(
        { id: 'gpt-4o', name: 'GPT-4o (Azure)', provider: 'azure', description: 'Enterprise grade' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Azure)', provider: 'azure', description: 'Cost effective' },
        { id: 'o3-mini', name: 'O3 Mini (Azure)', provider: 'azure', description: 'Latest reasoning' },
      );
    }
    
    return models;
  }),

  priorities: publicProcedure.query(async () => {
    // TODO: Load from config
    return {
      defaultProvider: 'azure',
      modelPriorities: [
        { model: 'o3-mini', priority: 1 },
        { model: 'gpt-4o', priority: 2 },
        { model: 'gemini-2.0-flash-exp', priority: 3 },
      ],
    };
  }),

  updatePriorities: publicProcedure
    .input(
      z.object({
        defaultProvider: z.enum(['openai', 'google', 'azure']).optional(),
        modelPriorities: z.array(
          z.object({
            model: z.string(),
            priority: z.number().min(1).max(100),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Save to config
      return { success: true };
    }),
});