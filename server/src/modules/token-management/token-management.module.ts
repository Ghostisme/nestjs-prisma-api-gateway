import { Module } from '@nestjs/common';
import { TokenManagementController } from './token-management.controller';
import { TokenManagementService } from './token-management.service';

@Module({
  controllers: [TokenManagementController],
  providers: [TokenManagementService],
  exports: [TokenManagementService],
})
export class TokenManagementModule {}
