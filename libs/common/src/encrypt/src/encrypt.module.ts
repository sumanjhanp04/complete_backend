import { Module } from '@nestjs/common';
import { AESEncryptionService } from './services/AESEncryption.service';

@Module({
  providers: [AESEncryptionService],
  exports: [AESEncryptionService],
})
export class encryptModule { }
