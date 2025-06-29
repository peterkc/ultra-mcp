import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export interface Context {
  req: Request;
  resHeaders: Headers;
}

export function createContext({ req, resHeaders }: FetchCreateContextFnOptions): Context {
  return {
    req,
    resHeaders,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;