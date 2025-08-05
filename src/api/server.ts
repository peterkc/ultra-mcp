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

// Serve static files for the dashboard
const distWebPath = path.join(__dirname, '..', 'dist-web');

// Create a new Hono instance for the web server
const webApp = new Hono();

if (existsSync(distWebPath)) {
  // Serve static assets from the root of the dist-web directory
  webApp.use('/*', serveStatic({ root: distWebPath }));

  // SPA Fallback: Serve index.html for any other non-API route
  webApp.get('*', (c) => {
    const indexPath = path.join(distWebPath, 'index.html');
    if (existsSync(indexPath)) {
      return c.html(readFileSync(indexPath, 'utf-8'));
    }
    return c.text('Dashboard not found. Please run `npm run build:dashboard`.', 404);
  });

  // Mount the web server as middleware
  app.route('/', webApp);
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