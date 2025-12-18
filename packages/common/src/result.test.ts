import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr } from './result.js';
describe('Result', () => {
  describe('ok', () => {
    it('creates a successful result', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });
    it('works with complex types', () => {
      const result = ok({ id: '1', name: 'test' });
      expect(result.ok).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual({ id: '1', name: 'test' });
      }
    });
  });
  describe('err', () => {
    it('creates a failed result', () => {
      const error = new Error('Something went wrong');
      const result = err(error);
      expect(result.ok).toBe(false);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });
    it('works with string errors', () => {
      const result = err('validation failed');
      expect(result.ok).toBe(false);
      if (isErr(result)) {
        expect(result.error).toBe('validation failed');
      }
    });
  });
  describe('isOk', () => {
    it('returns true for successful results', () => {
      const result = ok('success');
      expect(isOk(result)).toBe(true);
    });
    it('returns false for failed results', () => {
      const result = err('failure');
      expect(isOk(result)).toBe(false);
    });
  });
  describe('isErr', () => {
    it('returns true for failed results', () => {
      const result = err('failure');
      expect(isErr(result)).toBe(true);
    });
    it('returns false for successful results', () => {
      const result = ok('success');
      expect(isErr(result)).toBe(false);
    });
  });
  describe('type narrowing', () => {
    it('allows access to value after isOk check', () => {
      const result = ok(100);
      if (isOk(result)) {
        expect(result.value).toBe(100);
      }
    });
    it('allows access to error after isErr check', () => {
      const result = err('error message');
      if (isErr(result)) {
        expect(result.error).toBe('error message');
      }
    });
  });
});
