import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { EvidenceEntity } from 'src/expected-results/entities/expected-result.entity';
import { S3Service } from 'src/s3/s3.service';

@Resolver(() => EvidenceEntity)
export class EvidenceResolver {
  constructor(private readonly s3Service: S3Service) {}

  @ResolveField(() => String, { nullable: true })
  async url(@Parent() evidence: EvidenceEntity): Promise<string | null> {
    if (evidence.type === 'URL' && evidence.url) {
      return evidence.url;
    }
    if (evidence.fileKey) {
      return this.s3Service.getPresignedUrl(evidence.fileKey);
    }

    return null;
  }
}
