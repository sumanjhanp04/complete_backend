// Injectable allows this service to be injected into other services
import { Injectable } from '@nestjs/common';

// Used to read environment variables from .env
import { ConfigService } from '@nestjs/config';

// Node.js built-in crypto library
import * as crypto from 'crypto';

@Injectable()
export class AESEncryptionService {
  // Secret AES key used for encryption/decryption
  private readonly AES_KEY: string;

  constructor(private readonly configService: ConfigService) {
    // Read AES_KEY from .env file
    // Example:
    // AES_KEY=32_byte_hex_key_here
    this.AES_KEY = this.configService.get<string>('AES_KEY');
  }

  // =====================================
  // Encrypt Plain Text
  // =====================================
  encrypt(data: string): string {
    // Generate random 16-byte Initialization Vector (IV)
    // Every encryption gets a different IV
    const iv = crypto.randomBytes(16);

    // Create AES-256-CBC encryption cipher
    const cipher = crypto.createCipheriv(
      // Encryption algorithm
      'aes-256-cbc',

      // Secret key converted from HEX to Buffer
      Buffer.from(this.AES_KEY, 'hex'),

      // Initialization Vector
      iv,
    );

    // Encrypt text
    let encrypted = cipher.update(
      data,
      'utf-8', // input encoding
      'hex', // output encoding
    );

    // Final encryption block
    encrypted += cipher.final('hex');

    // Return IV + encrypted data
    // Format:
    // iv:encryptedText
    return `${iv.toString('hex')}:${encrypted}`;
  }

  // =====================================
  // Decrypt Encrypted Text
  // =====================================
  decrypt(data: string): string {
    // Split stored value
    // Example:
    // iv:encryptedData
    const [iv, encryptedData] = data.split(':');

    // Create AES decipher
    const decipher = crypto.createDecipheriv(
      // Same algorithm used for encryption
      'aes-256-cbc',

      // Same secret key
      Buffer.from(this.AES_KEY, 'hex'),

      // Convert IV back to Buffer
      Buffer.from(iv, 'hex'),
    );

    // Decrypt data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');

    // Final decryption block
    decrypted += decipher.final('utf-8');

    // Return original text
    return decrypted;
  }
}
