import { randomBytes, scrypt as _scrypt, createCipheriv, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import { init } from '@paralleldrive/cuid2';

const scrypt = promisify(_scrypt);
const createId = init({ length: 5 });

/**
 * Encrypts a string with a password using AES-256-GCM and per-message salt.
 * The output is base64 encoded and includes salt, IV, ciphertext, and authentication tag.
 *
 * @param data The string to encrypt
 * @param secret The password (used for key derivation)
 * @returns Promise that resolves to a base64 string: salt:iv:ciphertext:authTag
 *
 * @example
 *   const ciphertext = await encryptString('my secret text', 'password123');
 *
 */
export async function encryptString(data: string, secret: string): Promise<string> {
  if (!data || !secret) throw new Error("Data and secret must be non-empty strings");

  // Generate a random salt (5 chars)
  const salt = createId();
  const iv = randomBytes(12); // 96 bits, best for GCM
  const key = (await scrypt(secret, salt, 32)) as Buffer;

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Output format: salt:iv:ciphertext:authTag (each base64 except salt which is already ascii)
  return [salt, iv.toString('base64'), encrypted.toString('base64'), authTag.toString('base64')].join(':');
}

/**
 * Decrypts data encrypted by encryptString using the same password.
 *
 * @param encryptedData The base64 salt:iv:ciphertext:authTag string
 * @param secret The password (used for key derivation)
 * @returns Promise that resolves to the decrypted string
 *
 * @example
 *   const plain = await decryptString(ciphertext, 'password123');
 */
export async function decryptString(encryptedData: string, secret: string): Promise<string> {
  const [salt, ivB64, encryptedB64, authTagB64] = encryptedData.split(':');
  if (!salt || !ivB64 || !encryptedB64 || !authTagB64) {
    throw new Error('Invalid encrypted data format. Expected salt:iv:ciphertext:authTag');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const key = (await scrypt(secret, salt, 32)) as Buffer;

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * NOTES/BEST PRACTICES:
 * - Each ciphertext has a unique random salt, preventing rainbow table attacks.
 * - Output is salt (5-char CUID2, ascii), iv (base64), ciphertext (base64), authtag (base64).
 * - These functions are fully async.
 */
