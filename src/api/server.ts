import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';
import path from 'path';
import { createServer } from 'http';
import { existsSync, readFileSync } from 'fs';

const app = express();

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
app.use(morgan('dev'));
app.use(express.json());

// CORS for API routes
app.use('/api', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tRPC endpoint
app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files for the dashboard
const distWebPath = path.join(__dirname, '..', 'dist-web');

if (existsSync(distWebPath)) {
  // Serve static assets from dist-web/assets at /assets path
  const assetsPath = path.join(distWebPath, 'assets');
  if (existsSync(assetsPath)) {
    app.use('/assets', express.static(assetsPath));
  }

  // SPA Fallback: Serve index.html for any route that's not /api or /assets
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).send('Not Found');
    }
    
    const indexPath = path.join(distWebPath, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Dashboard not found. Please run `npm run build:dashboard`.');
    }
  });
}

export async function startDashboardServer(port: number = 3000) {
  try {
    const availablePort = await findAvailablePort(port);
    
    if (availablePort !== port) {
      console.log(`⚠️  Port ${port} is in use, using port ${availablePort} instead`);
    }
    
    console.log(`🚀 Dashboard server starting on http://localhost:${availablePort}`);
    
    const server = app.listen(availablePort, () => {
      console.log(`✅ Dashboard server running on http://localhost:${availablePort}`);
    });
    
    return availablePort;
  } catch (error) {
    console.error('Failed to start dashboard server:', error);
    throw error;
  }
}

export { app };