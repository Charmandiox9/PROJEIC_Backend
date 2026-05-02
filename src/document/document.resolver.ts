import {
  Resolver,
  Args,
  Mutation,
  ObjectType,
  Field,
  InputType,
  Int,
  Query,
} from '@nestjs/graphql';
import { DocumentService } from './document.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import {
  DocumentPresignedUrlResponse,
  SaveDocumentInput,
  ProjectDocumentResponse,
} from './entities/document.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver()
export class DocumentResolver {
  constructor(
    private readonly documentService: DocumentService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => DocumentPresignedUrlResponse)
  async getDocumentUploadUrl(
    @Args('projectId') projectId: string,
    @Args('fileName') fileName: string,
    @Args('fileType') fileType: string,
  ) {
    return this.storageService.generateDocumentUploadUrl(
      projectId,
      fileName,
      fileType,
    );
  }

  @Mutation(() => ProjectDocumentResponse)
  @UseGuards(GqlAuthGuard)
  async saveDocumentRecord(
    @Args('input') input: SaveDocumentInput,
    @CurrentUser() user: any,
  ) {
    const currentUserId = user.id || user.userId;

    return this.prisma.projectDocument.create({
      data: {
        name: input.name,
        r2Key: input.r2Key,
        fileType: input.fileType,
        size: input.size,
        projectId: input.projectId,
        uploadedById: currentUserId,
      },
      include: {
        uploadedBy: true,
      },
    });
  }

  @Query(() => String)
  @UseGuards(GqlAuthGuard)
  async getDocumentDownloadUrl(@Args('r2Key') r2Key: string) {
    return this.storageService.generateDocumentDownloadUrl(r2Key);
  }
}
