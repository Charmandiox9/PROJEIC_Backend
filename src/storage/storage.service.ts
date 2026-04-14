import { Injectable, InternalServerErrorException, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('STORAGE_BUCKET_NAME')!;
    
    this.s3Client = new S3Client({
      region: this.configService.get<string>('STORAGE_REGION') || 'auto',
      endpoint: this.configService.get<string>('STORAGE_ENDPOINT')!,
      credentials: {
        accessKeyId: this.configService.get<string>('STORAGE_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>('STORAGE_SECRET_KEY')!,
      },
      forcePathStyle: true, 
    });
  }

  async onModuleInit() {
    this.logger.log(`Probando conexión con el bucket: ${this.bucketName}...`);
    try {
      const command = new HeadBucketCommand({ Bucket: this.bucketName });
      await this.s3Client.send(command);
      this.logger.log('✅ ¡Conexión a R2/MinIO exitosa! El bucket existe y las credenciales son válidas.');
    } catch (error: any) {
      this.logger.error('❌ Error conectando a R2/MinIO. Revisa tus credenciales, el nombre del bucket o el endpoint.', error.message);
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      const uniqueFileName = `${uuidv4()}-${fileName.replace(/\s+/g, '-')}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      return uniqueFileName; 
    } catch (error) {
      this.logger.error("Error subiendo archivo:", error);
      throw new InternalServerErrorException('No se pudo subir el archivo');
    }
  }

  async getPresignedUploadUrl(fileName: string, contentType: string) {
    try {
      const uniqueFileName = `${uuidv4()}-${fileName.replace(/\s+/g, '-')}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFileName,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });

      return { uploadUrl, fileKey: uniqueFileName };
    } catch (error) {
      this.logger.error("Error generando URL de subida:", error);
      throw new InternalServerErrorException('No se pudo generar la URL para subir el archivo');
    }
  }
}   