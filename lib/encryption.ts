import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 64; // 64 bytes for salt
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 32 bytes for AES-256
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get encryption key from environment variable
 * Falls back to a default key in development (NOT for production)
 */
const getEncryptionKey = (): Buffer => {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "API_KEY_ENCRYPTION_SECRET environment variable is required in production"
      );
    }
    // Development fallback - warn but allow
    console.warn(
      "⚠️  API_KEY_ENCRYPTION_SECRET not set. Using default key (NOT SECURE FOR PRODUCTION)"
    );
    return crypto.scryptSync("default-dev-key-change-in-production", "salt", KEY_LENGTH);
  }
  
  // Derive a consistent key from the secret
  return crypto.scryptSync(secret, "api-key-encryption-salt", KEY_LENGTH);
};

/**
 * Encrypts an API key using AES-256-GCM
 * @param plaintext - The API key to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encryptedData (all base64)
 */
export const encryptApiKey = (plaintext: string): string => {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Invalid plaintext provided for encryption");
  }

  try {
    const key = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine: salt:iv:tag:encryptedData
    const saltBase64 = salt.toString("base64");
    const ivBase64 = iv.toString("base64");
    const tagBase64 = tag.toString("base64");
    
    return `${saltBase64}:${ivBase64}:${tagBase64}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt API key");
  }
};

/**
 * Decrypts an API key using AES-256-GCM
 * @param encryptedData - The encrypted string in format: salt:iv:tag:encryptedData
 * @returns Decrypted API key
 */
export const decryptApiKey = (encryptedData: string): string => {
  if (!encryptedData || typeof encryptedData !== "string") {
    throw new Error("Invalid encrypted data provided for decryption");
  }

  try {
    const key = getEncryptionKey();
    
    // Split the encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }
    
    const [saltBase64, ivBase64, tagBase64, encrypted] = parts;
    
    // Decode from base64
    const salt = Buffer.from(saltBase64, "base64");
    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    
    // Derive key from master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, "sha256");
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt API key - key may be corrupted or invalid");
  }
};

