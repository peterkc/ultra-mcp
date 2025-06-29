import { defineConfig } from 'drizzle-kit';
import { ConfigManager } from './src/config/manager';

// Get database path using ConfigManager
const configManager = new ConfigManager();
const dbPath = configManager.getDatabasePath();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${dbPath}`,
  },
  verbose: true,
  strict: true,
});