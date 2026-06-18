import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AESEncryptionService {
  private readonly AES_KEY: string;

  constructor(private readonly configService: ConfigService) {
    this.AES_KEY = this.configService.get<string>('AES_KEY');
  }

  encrypt(data: string): string {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.AES_KEY, 'hex'),
      iv,
    );
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`; // Return IV prepended to the encrypted text
  }

  decrypt(data: string): string {
    const [iv, encryptedData] = data.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.AES_KEY, 'hex'),
      Buffer.from(iv, 'hex'),
    );
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }
}
