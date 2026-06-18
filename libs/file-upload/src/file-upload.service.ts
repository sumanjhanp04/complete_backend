import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileMetadata } from '@lib/dto/dtos/credentials/create-file-credentials.dto';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_S3_REGION');
    const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_S3_SECRET_ACCESS_KEY',
    );

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    this.s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: 'application/octet-stream',
      });
      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw new Error('File upload failed.');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file:', error.message);
      throw new Error('File deletion failed.');
    }
  }

  // this method will create a signed url and send it back to the user
  async createSignedUrl(body: Omit<FileMetadata, 'size'>): Promise<any> {
    try {
      const { filename, type } = body;

      // Create the command to put an object in the S3 bucket
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        ContentType: type,
      });

      // Generate the signed URL
      const signedUrl = await getSignedUrl(this.s3Client as any, command, {
        expiresIn: 300,
      });


      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error.message);
      throw new Error('Failed to generate signed URL.');
    }
  }

  async verifyFileInS3(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}
