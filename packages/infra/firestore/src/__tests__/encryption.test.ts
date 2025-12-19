/**
 * Tests for token encryption utilities.
 */

import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken, generateEncryptionKey } from '../encryption.js';

describe('Token Encryption', () => {
  describe('encryptToken and decryptToken', () => {
    it('should encrypt and decrypt a token correctly', () => {
      const originalToken = 'v1.MRrT8shBGCG_MF6SaPp...sensitive-refresh-token';

      const encrypted = encryptToken(originalToken);
      expect(encrypted).not.toBe(originalToken);
      expect(encrypted).toContain(':'); // Should have IV:authTag:ciphertext format

      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(originalToken);
    });

    it('should produce different encrypted values for the same token', () => {
      const token = 'test-token-12345';

      const encrypted1 = encryptToken(token);
      const encrypted2 = encryptToken(token);

      // Different IV means different encrypted output
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same value
      expect(decryptToken(encrypted1)).toBe(token);
      expect(decryptToken(encrypted2)).toBe(token);
    });

    it('should handle empty strings', () => {
      const token = '';
      const encrypted = encryptToken(token);
      expect(decryptToken(encrypted)).toBe('');
    });

    it('should handle long tokens', () => {
      const token = 'x'.repeat(1000);
      const encrypted = encryptToken(token);
      expect(decryptToken(encrypted)).toBe(token);
    });

    it('should handle tokens with special characters', () => {
      const token = 'token-with_special.chars!@#$%^&*(){}[]|\\:;"\'<>,.?/~`';
      const encrypted = encryptToken(token);
      expect(decryptToken(encrypted)).toBe(token);
    });

    it('should throw error on invalid encrypted data format', () => {
      expect(() => decryptToken('invalid-format')).toThrow('Invalid encrypted data format');
      expect(() => decryptToken('only:two')).toThrow('Invalid encrypted data format');
      expect(() => decryptToken('')).toThrow('Invalid encrypted data format');
    });

    it('should throw error on tampered encrypted data', () => {
      const token = 'test-token';
      const encrypted = encryptToken(token);
      const parts = encrypted.split(':');

      if (parts.length !== 3 || parts[0] === undefined || parts[1] === undefined) {
        throw new Error('Unexpected encrypted format');
      }

      // Tamper with the ciphertext
      const tampered = `${parts[0]}:${parts[1]}:corrupted`;

      expect(() => decryptToken(tampered)).toThrow();
    });

    it('should throw error on tampered auth tag', () => {
      const token = 'test-token';
      const encrypted = encryptToken(token);
      const parts = encrypted.split(':');

      if (parts.length !== 3 || parts[0] === undefined || parts[2] === undefined) {
        throw new Error('Unexpected encrypted format');
      }

      // Tamper with the auth tag
      const tampered = `${parts[0]}:corrupted:${parts[2]}`;

      expect(() => decryptToken(tampered)).toThrow();
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a base64-encoded key', () => {
      const key = generateEncryptionKey();

      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);

      // Base64 validation
      expect(() => Buffer.from(key, 'base64')).not.toThrow();
    });

    it('should generate keys of correct length', () => {
      const key = generateEncryptionKey();
      const buffer = Buffer.from(key, 'base64');

      // Should be 32 bytes (256 bits)
      expect(buffer.length).toBe(32);
    });

    it('should generate different keys on each call', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });
});
