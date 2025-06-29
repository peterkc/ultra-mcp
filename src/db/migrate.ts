import { migrate } from 'drizzle-orm/libsql/migrator';
import { getDatabase } from './connection';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export async function runMigrations(): Promise<void> {
  try {
    const db = await getDatabase();
    // Find the package root directory (where drizzle/ folder is located)
    // In built package, this file is in dist/db/, so we go up to package root
    const packageRoot = join(__dirname, '..', '..');
    const migrationsFolder = join(packageRoot, 'drizzle');
    
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