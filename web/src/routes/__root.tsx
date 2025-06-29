import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { Home, BarChart3, Settings, Database } from 'lucide-react';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r min-h-screen p-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary">Ultra MCP</h1>
            <p className="text-sm text-muted-foreground">Dashboard</p>
          </div>
          
          <nav className="space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{
                className: 'bg-accent text-accent-foreground',
              }}
            >
              <Home className="h-4 w-4" />
              Overview
            </Link>
            
            <Link
              to="/usage"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{
                className: 'bg-accent text-accent-foreground',
              }}
            >
              <BarChart3 className="h-4 w-4" />
              Usage Analytics
            </Link>
            
            <Link
              to="/models"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{
                className: 'bg-accent text-accent-foreground',
              }}
            >
              <Database className="h-4 w-4" />
              Models
            </Link>
            
            <Link
              to="/config"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              activeProps={{
                className: 'bg-accent text-accent-foreground',
              }}
            >
              <Settings className="h-4 w-4" />
              Configuration
            </Link>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  ),
});