import { describe, it, expect } from 'vitest';

describe('Vector Database', () => {
  it('should be able to import vector db modules', async () => {
    // Just test that the modules can be imported without errors
    const { getVectorDB, clearVectorDB, getVectorCount, float32ArrayToBuffer, bufferToFloat32Array } = await import('../../vector/db');
    expect(getVectorDB).toBeDefined();
    expect(clearVectorDB).toBeDefined(); 
    expect(getVectorCount).toBeDefined();
    expect(float32ArrayToBuffer).toBeDefined();
    expect(bufferToFloat32Array).toBeDefined();
    expect(typeof getVectorDB).toBe('function');
  });

  it('should handle Float32Array buffer conversions', async () => {
    const { float32ArrayToBuffer, bufferToFloat32Array } = await import('../../vector/db');
    
    const originalArray = new Float32Array([1.5, 2.7, 3.14]);
    const buffer = float32ArrayToBuffer(originalArray);
    expect(buffer).toBeInstanceOf(Buffer);
    
    const restoredArray = bufferToFloat32Array(buffer);
    expect(restoredArray).toBeInstanceOf(Float32Array);
    expect(restoredArray.length).toBe(originalArray.length);
  });
});