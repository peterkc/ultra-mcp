import { z } from 'zod';

// API key validation schema
const ApiKeySchema = z.string().min(1).optional();

// Main configuration schema
export const ConfigSchema = z.object({
  openai: z.object({
    apiKey: ApiKeySchema,
  }).optional(),
  google: z.object({
    apiKey: ApiKeySchema,
  }).optional(),
  // Room for future expansion
  azure: z.object({
    apiKey: ApiKeySchema,
    endpoint: z.string().url().optional(),
  }).optional(),
  xai: z.object({
    apiKey: ApiKeySchema,
  }).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// Default configuration
export const defaultConfig: Config = {
  openai: {
    apiKey: undefined,
  },
  google: {
    apiKey: undefined,
  },
  azure: {
    apiKey: undefined,
    endpoint: undefined,
  },
  xai: {
    apiKey: undefined,
  },
};