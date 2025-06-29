import { describe, it, expect } from 'vitest';
import { cn, formatCost, formatNumber, formatDate } from '../utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});

describe('formatCost', () => {
  it('should format costs with 2 decimal places', () => {
    expect(formatCost(10)).toBe('$10.00');
    expect(formatCost(10.5)).toBe('$10.50');
  });

  it('should handle small costs with up to 4 decimal places', () => {
    expect(formatCost(0.0001)).toBe('$0.0001');
    expect(formatCost(0.00001)).toBe('$0.00');
  });

  it('should handle large numbers', () => {
    expect(formatCost(1234567.89)).toBe('$1,234,567.89');
  });

  it('should handle zero', () => {
    expect(formatCost(0)).toBe('$0.00');
  });
});

describe('formatNumber', () => {
  it('should format numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('should handle small numbers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(99)).toBe('99');
  });

  it('should handle decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });
});

describe('formatDate', () => {
  it('should format date strings', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should format Date objects', () => {
    const date = new Date('2024-12-25T00:00:00Z');
    const result = formatDate(date);
    expect(result).toMatch(/Dec 2[45], 2024/); // Handles timezone differences
  });

  it('should handle invalid dates gracefully', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('Invalid Date');
  });
});