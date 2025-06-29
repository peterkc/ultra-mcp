import { migrate } from 'drizzle-orm/libsql/migrator';
import { getDatabase } from './connection';
import { join } from 'path';

export async function runMigrations(): Promise<void> {
  try {
    const db = await getDatabase();
    // The drizzle folder is copied to dist/ by tsup, making it a sibling of the bundled code
    // In built package, this file is in dist/, and drizzle/ is also in dist/
    const migrationsFolder = join(__dirname, 'drizzle');
    
    await migrate(db as any, { migrationsFolder });
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}

// Auto-run migrations when this module is imported
// This ensures the database is always up-to-date
export async function ensureDatabaseReady(): Promise<void> {
  try {
    await runMigrations();
  } catch (error) {
    console.warn('Failed to run migrations, database may not be initialized:', error instanceof Error ? error.message : String(error));
  }
}