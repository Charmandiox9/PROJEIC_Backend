import { Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.STORAGE_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
      endpoint: process.env.STORAGE_ENDPOINT,
    });
  }

  async getPresignedUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET_NAME,
      Key: fileKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
