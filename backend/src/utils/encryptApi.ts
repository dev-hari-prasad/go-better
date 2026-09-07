import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

function getEncryptionKey(): Buffer {
  const secret = process.env.API_ENCRYPTION_KEY || 'gobetter-default-secret-key-32-bytes!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts an API key string using AES-256-GCM.
 * Output format: <iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(apiKey, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted API key.
 * If data is unencrypted or legacy format, gracefully falls back to raw string.
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) return '';
  if (!encryptedData.includes(':')) {
    return encryptedData;
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    return encryptedData;
  }

  const [ivHex, tagHex, contentHex] = parts;
  if (!ivHex || !tagHex || !contentHex) {
    return encryptedData;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(contentHex, 'hex')),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Failed to decrypt API key:', err);
    return encryptedData;
  }
}
