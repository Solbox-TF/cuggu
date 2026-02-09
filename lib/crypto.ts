import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 256-bit (64 hex chars)');
  }
  return buf;
}

/**
 * AES-256-GCM 암호화
 * @returns "iv:authTag:ciphertext" (base64)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * AES-256-GCM 복호화
 * @param encrypted - "iv:authTag:ciphertext" (base64)
 */
export function decrypt(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * 값이 암호화된 형태인지 판별
 * 평문(전화번호, 이메일)은 ':'를 포함하지 않으므로
 * "base64:base64:base64" 형태면 암호화로 판단
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;

  // 각 파트가 비어있지 않은 base64인지 확인
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return parts.every((part) => part.length > 0 && base64Regex.test(part));
}
