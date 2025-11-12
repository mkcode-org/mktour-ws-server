import { describe, expect, test, beforeAll } from 'bun:test';
import { encrypt, decrypt } from '@/lib/crypto';

beforeAll(() => {
  process.env.SECRET_KEY = 'test-secret-key-that-is-at-least-32-characters-long';
});

describe('crypto', () => {
  test('should encrypt and decrypt a simple string', () => {
    const original = 'hello world';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  test('should encrypt and decrypt a complex string', () => {
    const original = 'hello websocket! this message travels between app and ws server.';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  test('should produce different encrypted values for same input', () => {
    const original = 'test message';
    const encrypted1 = encrypt(original);
    const encrypted2 = encrypt(original);

    // Different encrypted values due to random salt and IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both decrypt to the same value
    expect(decrypt(encrypted1)).toBe(original);
    expect(decrypt(encrypted2)).toBe(original);
  });

  test('should handle empty string', () => {
    const original = '';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  test('should handle special characters', () => {
    const original = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  test('should handle unicode characters', () => {
    const original = '你好世界 🌍 مرحبا';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  test('encrypted string should be URL-safe base64', () => {
    const original = 'test message';
    const encrypted = encrypt(original);

    // Should not contain +, /, or = (URL-unsafe base64 characters)
    expect(encrypted).not.toContain('+');
    expect(encrypted).not.toContain('/');
    expect(encrypted).not.toContain('=');
  });

  test('should handle long strings', () => {
    const original = 'a'.repeat(1000);
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });
});
