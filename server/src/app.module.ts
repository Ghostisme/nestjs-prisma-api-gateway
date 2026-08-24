import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProxyModule } from './modules/proxy/proxy.module';
import { DictModule } from './modules/dict/dict.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TokenManagementModule } from './modules/token-management/token-management.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { BannedWordsModule } from './modules/banned-words/banned-words.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { PartnerModule } from './modules/partner/partner.module';
import { CollectorModule } from './modules/collector/collector.module';
import { UserModule } from './modules/user/user.module';
import { OrgModule } from './modules/org/org.module';
import { FileModule } from './modules/file/file.module';
import { LlmModelModule } from './modules/llm-model/llm-model.module';
import { UsageMeteringModule } from './modules/usage-metering/usage-metering.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { AgentMonitorModule } from './modules/agent-monitor/agent-monitor.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { DeerFlowProxyModule } from './modules/deerflow-proxy/deerflow-proxy.module';
import { NacosModule } from './modules/nacos/nacos.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),
    NacosModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    ProxyModule,
    DictModule,
    DashboardModule,
    TokenManagementModule,
    ConversationModule,
    BannedWordsModule,
    KnowledgeBaseModule,
    PartnerModule,
    CollectorModule,
    UserModule,
    OrgModule,
    FileModule,
    LlmModelModule,
    UsageMeteringModule,
    ApiKeyModule,
    AgentMonitorModule,
    SubscriptionModule,
    // Cron jobs are gated by SCHEDULER_ENABLED — skipped on serverless (Vercel),
    // enabled on a persistent host. See scheduler.module.ts for the rationale.
    SchedulerModule.register(),
    DeerFlowProxyModule,
  ],
})
export class AppModule {}
