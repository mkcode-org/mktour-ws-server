import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import type { Cipher, Decipher } from 'crypto';

const SECRET_KEY = process.env.CRYPTO_SECRET || 'default-secret-key';
const ALGORITHM = 'aes-256-cbc';

function deriveKey(password: string, salt: string): Uint8Array {
  const hash = createHash('sha256').update(password + salt).digest();
  return new Uint8Array(hash.buffer, hash.byteOffset, hash.byteLength);
}

export function encrypt(text: string): string {
  const salt = randomBytes(16).toString('hex');
  const ivBuffer = randomBytes(16);
  const iv = new Uint8Array(ivBuffer.buffer, ivBuffer.byteOffset, ivBuffer.byteLength);
  const key = deriveKey(SECRET_KEY, salt);
  
  const cipher: Cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return salt + ':' + ivBuffer.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('invalid encrypted text format');
  }
  
  const salt = parts[0];
  const ivBuffer = Buffer.from(parts[1], 'hex');
  const iv = new Uint8Array(ivBuffer.buffer, ivBuffer.byteOffset, ivBuffer.byteLength);
  const encrypted = parts[2];
  
  const key = deriveKey(SECRET_KEY, salt);
  
  const decipher: Decipher = createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}