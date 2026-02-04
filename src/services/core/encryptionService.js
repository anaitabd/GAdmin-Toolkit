const crypto = require('crypto');
const logger = require('../../utils/logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.key = this.getEncryptionKey();
  }

  getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
    }
    return Buffer.from(key, 'utf8');
  }

  encrypt(data) {
    try {
      if (!data) {
        throw new Error('No data provided for encryption');
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      throw error;
    }
  }

  decrypt(encryptedData) {
    try {
      if (!encryptedData) {
        throw new Error('No data provided for decryption');
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      throw error;
    }
  }

  encryptJSON(obj) {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  decryptJSON(encryptedData) {
    const jsonString = this.decrypt(encryptedData);
    return JSON.parse(jsonString);
  }
}

module.exports = new EncryptionService();
