import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserContext } from '../../common/interfaces/user-context.interface';

const ALL_PERMISSIONS = [
  'lmxAdmin:aiDashboard:userDashboard',                          // AI仪表盘 - 用户概览
  'lmxAdmin:aiDashboard:tokenUsage',                             // AI仪表盘 - Token用量
  'lmxAdmin:aiDashboard:userFeedback',                           // AI仪表盘 - 用户反馈
  'lmxAdmin:aiManagement:tokenUserManagement',                   // AI管理 - Token用户管理
  'lmxAdmin:aiManagement:tokenUserManagement:manageQuota',       // AI管理 - Token用户管理 - 管理配额
  'lmxAdmin:aiManagement:tokenUserManagement:records',           // AI管理 - Token用户管理 - 查看记录
  'lmxAdmin:aiManagement:tokenUserManagement:consumption',       // AI管理 - Token用户管理 - 查看消耗
  'lmxAdmin:aiManagement:tokenSystemManagement',                 // AI管理 - Token系统管理
  'lmxAdmin:aiManagement:tokenSystemManagement:configDept',      // AI管理 - Token系统管理 - 配置部门
  'lmxAdmin:aiManagement:tokenSystemManagement:configMember',    // AI管理 - Token系统管理 - 配置成员
  'lmxAdmin:aiManagement:tokenSystemManagement:viewDetail',      // AI管理 - Token系统管理 - 查看详情
  'lmxAdmin:aiManagement:userConversationStats',                 // AI管理 - 用户对话统计
  'lmxAdmin:aiManagement:userConversationStats:viewDetail',      // AI管理 - 用户对话统计 - 查看详情
  'lmxAdmin:aiManagement:bannedWords',                           // AI管理 - 违禁词管理
  'lmxAdmin:aiKnowledge:knowledgeBase',                          // AI知识库 - 知识库管理
  'lmxAdmin:partner:read',                                       // 合作伙伴 - 查看列表
  'lmxAdmin:partner:create',                                     // 合作伙伴 - 新增
  'lmxAdmin:partner:update',                                     // 合作伙伴 - 编辑
  'lmxAdmin:partner:delete',                                     // 合作伙伴 - 删除
  'lmxAdmin:partner:disabled',                                   // 合作伙伴 - 禁用
  'lmxAdmin:partner:enabled',                                    // 合作伙伴 - 启用
  'lmxAdmin:partner:createAccount',                              // 合作伙伴 - 创建账号
  'admin:account:read',                                          // 账号管理 - 查看列表
  'admin:account:create',                                        // 账号管理 - 新增
  'admin:account:view',                                          // 账号管理 - 查看详情
  'admin:account:update',                                        // 账号管理 - 编辑
  'admin:account:disabled',                                      // 账号管理 - 禁用
  'admin:account:enabled',                                       // 账号管理 - 启用
  'admin:account:resetPassword',                                 // 账号管理 - 重置密码
  'admin:role:read',                                             // 角色管理 - 查看列表
  'admin:role:create',                                           // 角色管理 - 新增
  'admin:role:update',                                           // 角色管理 - 编辑
  'admin:role:disabled',                                         // 角色管理 - 禁用
  'admin:role:enabled',                                          // 角色管理 - 启用
  'admin:dept:read',                                             // 部门管理 - 查看列表
  'admin:dept:export',                                           // 部门管理 - 导出
  'admin:dept:viewDeptUsers',                                    // 部门管理 - 查看部门用户
  'admin:dept:exportDeptUsers',                                  // 部门管理 - 导出部门用户
  'lmxAdmin:global:upload',                                      // 全局 - 上传
  'lmxAdmin:global:download',                                    // 全局 - 下载
];

const PARTNER_PERMISSIONS = [
  'lmxAdmin:aiDashboard:userDashboard',
  'lmxAdmin:aiDashboard:tokenUsage',
  'lmxAdmin:aiDashboard:userFeedback',
  'admin:account:read',
  'admin:account:view',
];

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  getMockPermissions(user: UserContext) {
    const isSuperAdmin = user.roles.some((r) => r === 'ROLE_4' || r === 'ROLE_1');

    if (isSuperAdmin) {
      return { permissions: ALL_PERMISSIONS };
    }

    const isPartnerAdmin = user.roles.some((r) => r === 'ROLE_PARTNER');
    if (isPartnerAdmin) {
      return { permissions: PARTNER_PERMISSIONS };
    }

    return {
      permissions: [
        'lmxAdmin:aiDashboard:userDashboard',
        'lmxAdmin:aiDashboard:tokenUsage',
        'lmxAdmin:aiDashboard:userFeedback',
      ],
    };
  }

  async getQuotaRemaining(tenantId: number, userId: number) {
    const quota = await this.prisma.lumaxUserQuota.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (!quota || quota.totalQuota === -1) {
      return { totalQuota: -1, usedQuota: quota?.usedQuota ?? 0, remaining: -1 };
    }
    return {
      totalQuota: quota.totalQuota,
      usedQuota: quota.usedQuota,
      remaining: Math.max(0, quota.totalQuota - quota.usedQuota),
    };
  }
}
