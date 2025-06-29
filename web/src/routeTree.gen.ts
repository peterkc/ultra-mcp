import { Route as rootRoute } from './routes/__root';
import { Route as IndexRoute } from './routes/index';
import { Route as ConfigRoute } from './routes/config';
import { Route as ModelsRoute } from './routes/models';
import { Route as UsageRoute } from './routes/usage';

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      parentRoute: typeof rootRoute;
    };
    '/config': {
      parentRoute: typeof rootRoute;
    };
    '/models': {
      parentRoute: typeof rootRoute;
    };
    '/usage': {
      parentRoute: typeof rootRoute;
    };
  }
}

Object.assign(IndexRoute.options, {
  path: '/',
  getParentRoute: () => rootRoute,
});

Object.assign(ConfigRoute.options, {
  path: '/config',
  getParentRoute: () => rootRoute,
});

Object.assign(ModelsRoute.options, {
  path: '/models',
  getParentRoute: () => rootRoute,
});

Object.assign(UsageRoute.options, {
  path: '/usage',
  getParentRoute: () => rootRoute,
});

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  ConfigRoute,
  ModelsRoute,
  UsageRoute,
]);