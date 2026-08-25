/**
 * 演示模式共享的权限码清单。
 *
 * 单一数据源：同时被 OpaqueTokenGuard 的 MOCK_USER（注入到 request.user，
 * 决定后端 @CurrentUser 拿到的权限）和 DemoAuthController 返回的 user_info
 * （决定前端菜单/按钮的可见性）复用，避免两处各维护一份权限列表导致"前端看得到
 * 菜单、后端却拒绝"或反之的漂移。
 *
 * 覆盖 AI Dashboard / Token 管理 / 会话统计 / 违禁词 / 知识库 / 合作企业 /
 * 账号角色部门 / 全局上传下载等全部演示可见模块。
 */
export const DEMO_PERMISSIONS: string[] = [
  'lmxAdmin:aiDashboard:userDashboard',
  'lmxAdmin:aiDashboard:tokenUsage',
  'lmxAdmin:aiDashboard:userFeedback',
  'lmxAdmin:aiManagement:tokenUserManagement',
  'lmxAdmin:aiManagement:tokenUserManagement:manageQuota',
  'lmxAdmin:aiManagement:tokenUserManagement:records',
  'lmxAdmin:aiManagement:tokenUserManagement:consumption',
  'lmxAdmin:aiManagement:tokenSystemManagement',
  'lmxAdmin:aiManagement:tokenSystemManagement:configDept',
  'lmxAdmin:aiManagement:tokenSystemManagement:configMember',
  'lmxAdmin:aiManagement:tokenSystemManagement:viewDetail',
  'lmxAdmin:aiManagement:userConversationStats',
  'lmxAdmin:aiManagement:userConversationStats:viewDetail',
  'lmxAdmin:aiManagement:bannedWords',
  'lmxAdmin:aiKnowledge:knowledgeBase',
  'lmxAdmin:partner:read',
  'lmxAdmin:partner:create',
  'lmxAdmin:partner:update',
  'lmxAdmin:partner:delete',
  'lmxAdmin:partner:disabled',
  'lmxAdmin:partner:enabled',
  'lmxAdmin:partner:createAccount',
  'admin:account:read',
  'admin:account:create',
  'admin:account:view',
  'admin:account:update',
  'admin:account:disabled',
  'admin:account:enabled',
  'admin:account:resetPassword',
  'admin:role:read',
  'admin:role:create',
  'admin:role:update',
  'admin:role:disabled',
  'admin:role:enabled',
  'admin:dept:read',
  'admin:dept:export',
  'admin:dept:viewDeptUsers',
  'admin:dept:exportDeptUsers',
  'lmxAdmin:global:upload',
  'lmxAdmin:global:download',
];
