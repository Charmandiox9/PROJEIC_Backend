import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentResolver } from './document.resolver';

@Module({
  providers: [DocumentResolver, DocumentService],
})
export class DocumentModule {}
