import { Module } from '@nestjs/common';
import { UsageMeteringController } from './usage-metering.controller';
import { UsageMeteringService } from './usage-metering.service';
import { LlmModelModule } from '../llm-model/llm-model.module';

@Module({
  imports: [LlmModelModule],
  controllers: [UsageMeteringController],
  providers: [UsageMeteringService],
  exports: [UsageMeteringService],
})
export class UsageMeteringModule {}
