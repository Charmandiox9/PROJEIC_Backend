import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { User } from 'src/auth/entities/auth.entity';

@ObjectType()
export class DocumentPresignedUrlResponse {
  @Field()
  uploadUrl: string;

  @Field()
  r2Key: string;
}

@InputType()
export class SaveDocumentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  r2Key: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  size: number;
}

@ObjectType()
export class DocumentUploader {
  @Field() id: string;
  @Field() name: string;
}

@ObjectType()
export class ProjectDocumentResponse {
  @Field() id: string;
  @Field() name: string;
  @Field() r2Key: string;
  @Field() fileType: string;
  @Field(() => Int) size: number;
  @Field() projectId: string;
  @Field(() => DocumentUploader)
  uploadedBy: DocumentUploader;
  @Field(() => Date) createdAt: Date;
}
