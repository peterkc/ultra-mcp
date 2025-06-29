import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// tRPC endpoint
app.use(
  '/api/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist-web');
  app.use('/*', serveStatic({ root: distPath }));
  
  // SPA fallback
  app.get('/*', (c) => {
    return c.html(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ultra MCP Dashboard</title>
          <script type="module" crossorigin src="/assets/index.js"></script>
          <link rel="stylesheet" href="/assets/index.css">
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>`
    );
  });
}

export function startDashboardServer(port: number = 3000) {
  console.log(`🚀 Dashboard server starting on http://localhost:${port}`);
  
  serve({
    fetch: app.fetch,
    port,
  });
}

export { app };