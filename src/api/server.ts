import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { createServer } from 'http';
import { existsSync, readFileSync } from 'fs';

const app = new Hono();

// Helper function to check if a port is available
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// Helper function to find an available port
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 10; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found starting from ${startPort}`);
}

// Middleware
app.use('*', logger());
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
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

// Serve static files when dist-web directory exists
const distPath = path.join(process.cwd(), 'dist-web');
if (existsSync(distPath)) {
  // First, set up static file serving for specific asset paths
  app.use('/assets/*', serveStatic({ root: distPath }));
  app.use('/favicon.ico', serveStatic({ root: distPath }));
  app.use('/vite.svg', serveStatic({ root: distPath }));
  
  // SPA fallback - serve index.html for non-API routes
  const indexPath = path.join(distPath, 'index.html');
  let indexHtml = '';
  
  if (existsSync(indexPath)) {
    indexHtml = readFileSync(indexPath, 'utf-8');
  } else {
    // Fallback HTML if index.html doesn't exist
    indexHtml = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ultra MCP Dashboard</title>
      </head>
      <body>
        <div id="root">Dashboard not available - build not found</div>
      </body>
    </html>`;
  }
  
  // Only serve index.html for non-API routes
  app.get('/', (c) => c.html(indexHtml));
  app.get('/config', (c) => c.html(indexHtml));
  app.get('/models', (c) => c.html(indexHtml));
  app.get('/usage', (c) => c.html(indexHtml));
}

export async function startDashboardServer(port: number = 3000) {
  try {
    const availablePort = await findAvailablePort(port);
    
    if (availablePort !== port) {
      console.log(`⚠️  Port ${port} is in use, using port ${availablePort} instead`);
    }
    
    console.log(`🚀 Dashboard server starting on http://localhost:${availablePort}`);
    
    serve({
      fetch: app.fetch,
      port: availablePort,
    });
    
    return availablePort;
  } catch (error) {
    console.error('Failed to start dashboard server:', error);
    throw error;
  }
}

export { app };