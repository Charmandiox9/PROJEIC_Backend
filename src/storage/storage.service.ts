import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;

  // Guardamos las referencias a ambos buckets
  private imagesBucket: string;
  private docsBucket: string;

  constructor(private configService: ConfigService) {
    this.imagesBucket = this.configService.get<string>('STORAGE_BUCKET_NAME')!;
    this.docsBucket = this.configService.get<string>('STORAGE_DOCS_BUCKET')!;

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
    this.logger.log(`Probando conexión con Cloudflare R2...`);
    try {
      // Probamos el bucket de imágenes
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.imagesBucket }),
      );
      this.logger.log(
        `✅ Conectado al bucket de imágenes: ${this.imagesBucket}`,
      );

      // Probamos el bucket de documentos
      if (this.docsBucket) {
        await this.s3Client.send(
          new HeadBucketCommand({ Bucket: this.docsBucket }),
        );
        this.logger.log(
          `✅ Conectado al bucket de documentos: ${this.docsBucket}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        '❌ Error conectando a R2. Revisa tus credenciales o los nombres de los buckets.',
        error.message,
      );
    }
  }

  // ====================================================================
  // MÉTODOS PARA EL BUCKET DE IMÁGENES (Resultados Esperados, etc)
  // ====================================================================

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string> {
    try {
      const uniqueFileName = `${uuidv4()}-${fileName.replace(/\s+/g, '-')}`;

      const command = new PutObjectCommand({
        Bucket: this.imagesBucket, // Usa el bucket de imágenes
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      return uniqueFileName;
    } catch (error) {
      this.logger.error('Error subiendo imagen:', error);
      throw new InternalServerErrorException('No se pudo subir la imagen');
    }
  }

  async getPresignedUploadUrl(fileName: string, contentType: string) {
    try {
      const uniqueFileName = `${uuidv4()}-${fileName.replace(/\s+/g, '-')}`;

      const command = new PutObjectCommand({
        Bucket: this.imagesBucket,
        Key: uniqueFileName,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 300,
      });

      return { uploadUrl, fileKey: uniqueFileName };
    } catch (error) {
      this.logger.error('Error generando URL de subida de imagen:', error);
      throw new InternalServerErrorException(
        'No se pudo generar la URL para subir la imagen',
      );
    }
  }

  // ====================================================================
  // MÉTODOS PARA EL BUCKET DE DOCUMENTOS (Informes, PDFs, etc)
  // ====================================================================

  async generateDocumentUploadUrl(
    projectId: string,
    fileName: string,
    fileType: string,
  ) {
    try {
      if (!this.docsBucket)
        throw new Error('Bucket de documentos no configurado');

      const uniqueKey = `proyectos/${projectId}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

      const command = new PutObjectCommand({
        Bucket: this.docsBucket,
        Key: uniqueKey,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 900,
      });

      return { uploadUrl, r2Key: uniqueKey };
    } catch (error) {
      this.logger.error('Error generando URL de documento:', error);
      throw new InternalServerErrorException(
        'Error al preparar la subida del documento',
      );
    }
  }

  async generateDocumentDownloadUrl(r2Key: string) {
    try {
      if (!this.docsBucket)
        throw new Error('Bucket de documentos no configurado');

      const command = new GetObjectCommand({
        Bucket: this.docsBucket,
        Key: r2Key,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });
    } catch (error) {
      this.logger.error('Error generando URL de descarga:', error);
      throw new InternalServerErrorException(
        'No se pudo generar el enlace de descarga',
      );
    }
  }
}
