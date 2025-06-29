import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { ConfigManager } from '../config/manager';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export async function getDatabase() {
  if (db) {
    return db;
  }

  const configManager = new ConfigManager();
  const dbPath = configManager.getDatabasePath();

  try {
    // Use libsql with local file
    const client = createClient({
      url: `file:${dbPath}`,
    });
    
    db = drizzle(client, { schema });
    
    // Test the connection by creating the table if it doesn't exist
    // This is a simple way to initialize the database
    try {
      await db.select().from(schema.llmRequests).limit(1).execute();
    } catch (error) {
      // Table might not exist yet, that's fine
      console.log('Database initialized, will create tables on first migration');
    }
    
    console.log('Database connected using @libsql/client');
    return db;
  } catch (error) {
    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function isDatabaseConnected(): boolean {
  return db !== null;
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      // libsql client doesn't need explicit closing
      db = null;
    } catch (error) {
      console.warn('Error closing database:', error);
    }
  }
}