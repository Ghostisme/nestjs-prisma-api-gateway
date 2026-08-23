import { Module } from '@nestjs/common';
import { LlmModelController } from './llm-model.controller';
import { LlmModelService } from './llm-model.service';

@Module({
  controllers: [LlmModelController],
  providers: [LlmModelService],
  exports: [LlmModelService],
})
export class LlmModelModule {}
