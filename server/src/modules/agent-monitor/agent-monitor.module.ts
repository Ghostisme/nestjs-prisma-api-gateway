import { Module } from '@nestjs/common';
import { AgentMonitorController } from './agent-monitor.controller';
import { AgentMonitorService } from './agent-monitor.service';

@Module({
  controllers: [AgentMonitorController],
  providers: [AgentMonitorService],
  exports: [AgentMonitorService],
})
export class AgentMonitorModule {}
