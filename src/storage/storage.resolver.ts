import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { StorageService } from './storage.service';

@ObjectType()
export class PresignedUrlResponse {
  @Field()
  uploadUrl: string;

  @Field()
  fileKey: string;
}

@Resolver()
export class UploadsResolver {
  constructor(private readonly storageService: StorageService) {}

  @Mutation(() => PresignedUrlResponse)
  async getUploadPresignedUrl(
    @Args('fileName') fileName: string,
    @Args('contentType') contentType: string,
  ) {
    return this.storageService.getPresignedUploadUrl(fileName, contentType);
  }
}