import { Module } from '@nestjs/common';
import { BannedWordsModule } from '../banned-words/banned-words.module';
import { CollectorController } from './collector.controller';
import { CollectorService } from './collector.service';
import { LlmModelModule } from '../llm-model/llm-model.module';

@Module({
  imports: [LlmModelModule, BannedWordsModule],
  // imports: [BannedWordsModule],
  controllers: [CollectorController],
  providers: [CollectorService],
})
export class CollectorModule {}
