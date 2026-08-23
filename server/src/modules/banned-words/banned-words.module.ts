import { Module } from '@nestjs/common';
import { BannedWordsController } from './banned-words.controller';
import { BannedWordsCacheService } from './banned-words-cache.service';
import { BannedWordsService } from './banned-words.service';

@Module({
  controllers: [BannedWordsController],
  providers: [BannedWordsService, BannedWordsCacheService],
  exports: [BannedWordsService, BannedWordsCacheService],
})
export class BannedWordsModule {}
