import { router } from './trpc';
import { statsRouter } from './routers/stats';
import { configRouter } from './routers/config';
import { modelsRouter } from './routers/models';

export const appRouter = router({
  stats: statsRouter,
  config: configRouter,
  models: modelsRouter,
});

export type AppRouter = typeof appRouter;