import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVectorDB, clearVectorDB, getVectorCount, float32ArrayToBuffer, bufferToFloat32Array } from '../../vector/db';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('@libsql/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('drizzle-orm/libsql', () => ({
  drizzle: vi.fn(),
}));

describe('Vector Database', () => {
  let mockClient: any;
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDb = {
      run: vi.fn().mockResolvedValue({}),
      get: vi.fn(),
    };

    mockClient = {
      execute: vi.fn().mockResolvedValue({ rows: [], columns: [], columnTypes: [] }),
    };

    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');
    
    vi.mocked(createClient).mockReturnValue(mockClient);
    vi.mocked(drizzle).mockReturnValue(mockDb);
  });

  describe('getVectorDB', () => {
    it('should create database directory if it does not exist', async () => {
      (existsSync as any).mockReturnValue(false);

      const projectPath = '/test/project';
      const { db, client, path } = await getVectorDB(projectPath);

      expect(mkdirSync).toHaveBeenCalledWith(
        join(projectPath, '.ultra-mcp'),
        { recursive: true }
      );
      expect(db).toBe(mockDb);
      expect(client).toBe(mockClient);
      expect(path).toBe(join(projectPath, '.ultra-mcp', 'vector-index-v1.sqlite3'));
    });

    it('should run string-based migrations', async () => {
      (existsSync as any).mockReturnValue(true);

      await getVectorDB('/test/project');

      // Check table creation
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS vector_chunks')
      );

      // Check index creation
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS relpath_idx')
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS hash_idx')
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS vec_idx')
      );
    });

    it('should handle vector index creation failure gracefully', async () => {
      (existsSync as any).mockReturnValue(true);
      
      // Fail only on vector index creation
      mockDb.run.mockImplementation((sql: string) => {
        if (sql.includes('vec_idx')) {
          throw new Error('Vector extension not available');
        }
        return Promise.resolve();
      });

      const { db, client } = await getVectorDB('/test/project');
      
      expect(db).toBeDefined();
      // Should have attempted to create vector index
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('vec_idx')
      );
    });
  });

  describe('clearVectorDB', () => {
    it('should delete all vector chunks', async () => {
      await clearVectorDB('/test/project');

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'DELETE FROM vector_chunks',
        args: []
      });
    });

    it('should throw error on failure', async () => {
      // Mock successful initialization but fail on the DELETE operation
      mockClient.execute.mockImplementation((query: any) => {
        if (query.sql.includes('DELETE FROM vector_chunks')) {
          return Promise.reject(new Error('Database error'));
        }
        return Promise.resolve({ rows: [], columns: [], columnTypes: [] });
      });

      await expect(clearVectorDB('/test/project')).rejects.toThrow(
        'Failed to clear vector database: Database error'
      );
    });
  });

  describe('getVectorCount', () => {
    it('should return the count of vectors', async () => {
      mockClient.execute.mockResolvedValue({ 
        rows: [[42]], 
        columns: ['count'], 
        columnTypes: ['INTEGER'] 
      });

      const count = await getVectorCount('/test/project');

      expect(count).toBe(42);
      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'SELECT COUNT(*) as count FROM vector_chunks',
        args: []
      });
    });

    it('should return 0 if result is null', async () => {
      mockClient.execute.mockResolvedValue({ 
        rows: [], 
        columns: ['count'], 
        columnTypes: ['INTEGER'] 
      });

      const count = await getVectorCount('/test/project');

      expect(count).toBe(0);
    });

    it('should return 0 on error', async () => {
      mockClient.execute.mockRejectedValue(new Error('Database error'));

      const count = await getVectorCount('/test/project');

      expect(count).toBe(0);
    });
  });

  describe('Buffer conversions', () => {
    it('should convert float32 array to buffer', () => {
      const array = [0.1, 0.2, 0.3, 0.4];
      const buffer = float32ArrayToBuffer(array);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(16); // 4 floats * 4 bytes each
    });

    it('should convert buffer to float32 array', () => {
      const originalArray = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const buffer = Buffer.from(originalArray.buffer);
      const result = bufferToFloat32Array(buffer);

      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(4);
      // Use approximate equality for floating point numbers
      expect(result[0]).toBeCloseTo(0.1, 5);
      expect(result[1]).toBeCloseTo(0.2, 5);
      expect(result[2]).toBeCloseTo(0.3, 5);
      expect(result[3]).toBeCloseTo(0.4, 5);
    });

    it('should handle round-trip conversion', () => {
      const original = [0.1, 0.2, 0.3, 0.4];
      const buffer = float32ArrayToBuffer(original);
      const result = bufferToFloat32Array(buffer);

      // Use approximate equality for floating point numbers
      expect(result.length).toBe(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(result[i]).toBeCloseTo(original[i], 5);
      }
    });
  });
});