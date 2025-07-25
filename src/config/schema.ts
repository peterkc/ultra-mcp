import { z } from 'zod';

// API key validation schema
const ApiKeySchema = z.string().min(1).optional();

// Main configuration schema
export const ConfigSchema = z.object({
  openai: z.object({
    apiKey: ApiKeySchema,
    baseURL: z.string().url().optional(),
  }).optional(),
  google: z.object({
    apiKey: ApiKeySchema,
    baseURL: z.string().url().optional(),
  }).optional(),
  // Room for future expansion
  azure: z.object({
    apiKey: ApiKeySchema,
    baseURL: z.string().url().optional(),
  }).optional(),
  xai: z.object({
    apiKey: ApiKeySchema,
    baseURL: z.string().url().optional(),
  }).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// Default configuration
export const defaultConfig: Config = {
  openai: {
    apiKey: undefined,
    baseURL: undefined,
  },
  google: {
    apiKey: undefined,
    baseURL: undefined,
  },
  azure: {
    apiKey: undefined,
    baseURL: undefined,
  },
  xai: {
    apiKey: undefined,
    baseURL: undefined,
  },
};