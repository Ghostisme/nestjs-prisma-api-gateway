/** 权限 code 常量映射，用于菜单 auth、按钮 AuthGuard 等与接口返回的 permissions 匹配 */
export const LMX_ADMIN_PERMISSIONS = {
	// AI监控数据看板
	aiDashboard_userDashboard: "lmxAdmin:aiDashboard:userDashboard",
	aiDashboard_tokenUsage: "lmxAdmin:aiDashboard:tokenUsage",
	aiDashboard_userFeedback: "lmxAdmin:aiDashboard:userFeedback",

	// AI质量管理中心
	aiManagement_tokenUserManagement: "lmxAdmin:aiManagement:tokenUserManagement",
	aiManagement_tokenUserManagement_manageQuota: "lmxAdmin:aiManagement:tokenUserManagement:manageQuota",
	aiManagement_tokenUserManagement_records: "lmxAdmin:aiManagement:tokenUserManagement:records",
	aiManagement_tokenUserManagement_consumption: "lmxAdmin:aiManagement:tokenUserManagement:consumption",
	aiManagement_tokenSystemManagement: "lmxAdmin:aiManagement:tokenSystemManagement",
	aiManagement_tokenSystemManagement_configDept: "lmxAdmin:aiManagement:tokenSystemManagement:configDept",
	aiManagement_tokenSystemManagement_configMember: "lmxAdmin:aiManagement:tokenSystemManagement:configMember",
	aiManagement_tokenSystemManagement_viewDetail: "lmxAdmin:aiManagement:tokenSystemManagement:viewDetail",
	aiManagement_userConversationStats: "lmxAdmin:aiManagement:userConversationStats",
	aiManagement_userConversationStats_viewDetail: "lmxAdmin:aiManagement:userConversationStats:viewDetail",
	aiManagement_bannedWords: "lmxAdmin:aiManagement:bannedWords",

	// AI质量知识中心
	aiKnowledge_knowledgeBase: "lmxAdmin:aiKnowledge:knowledgeBase",

	// 合作企业管理
	partner_read: "lmxAdmin:partner:read",
	partner_create: "lmxAdmin:partner:create",
	partner_update: "lmxAdmin:partner:update",
	partner_delete: "lmxAdmin:partner:delete",
	partner_disabled: "lmxAdmin:partner:disabled",
	partner_enabled: "lmxAdmin:partner:enabled",
	partner_createAccount: "lmxAdmin:partner:createAccount",
	// 查看企业账号
	partner_viewAccount: "lmxAdmin:partner:viewAccount",
	// 编辑企业账号
	partner_updateAccount: "lmxAdmin:partner:updateAccount",
	// 重置企业账号密码
	partner_resetAccountPassword: "lmxAdmin:partner:resetAccountPassword",

	// 账户管理 (保持 admin: 前缀, Java UPMS 定义)
	user_read: "admin:account:read",
	user_create: "admin:account:create",
	user_view: "admin:account:view",
	user_update: "admin:account:update",
	user_disabled: "admin:account:disabled",
	user_enabled: "admin:account:enabled",
	user_resetPassword: "admin:account:resetPassword",
	role_read: "admin:role:read",
	role_create: "admin:role:create",
	role_update: "admin:role:update",
	role_disabled: "admin:role:disabled",
	role_enabled: "admin:role:enabled",
	dept_read: "admin:dept:read",
	dept_export: "admin:dept:export",
	dept_viewDeptUsers: "admin:dept:viewDeptUsers",
	dept_exportDeptUsers: "admin:dept:exportDeptUsers",

	// 运营中心
	opsCenter_usageAnalytics: "ops:usage:view",
	opsCenter_quotaManagement: "ops:quota:manage",
	opsCenter_agentMonitor: "ops:monitor:view",
	opsCenter_skillsRanking: "ops:skills:view",

	// 开发者中心
	developerCenter_apiKeys: "developer:apikey:manage",
	developerCenter_models: "developer:model:manage",

	// 计费中心
	billingCenter_subscription: "billing:subscription:view",
	billingCenter_plans: "billing:subscription:manage",

	// 通用权限
	global_upload: "lmxAdmin:global:upload",
	global_download: "lmxAdmin:global:download",
} as const;

/** 由常量映射推导的权限 code 联合类型 */
export type lmxAdminPermission = (typeof LMX_ADMIN_PERMISSIONS)[keyof typeof LMX_ADMIN_PERMISSIONS];

/** 所有前端权限 code 列表 */
export const LMX_ADMIN_PERMISSION_CODES: lmxAdminPermission[] = Object.values(LMX_ADMIN_PERMISSIONS);

/**
 * 根据接口返回的权限 code 列表，判断是否拥有指定权限
 * @param userPermissionCodes 接口 user_info.permissions 解析后的 code 列表
 * @param required 需要检查的权限 code
 */
export const hasPermission = (userPermissionCodes: string[], required: lmxAdminPermission | string): boolean =>
	userPermissionCodes.includes(required);

// 兼容旧代码引用
/** @deprecated use LMX_ADMIN_PERMISSIONS */
export const XDWX_ADMIN_PERMISSIONS = LMX_ADMIN_PERMISSIONS;
/** @deprecated use lmxAdminPermission */
export type xdwxAdminPermission = lmxAdminPermission;
/** @deprecated use LMX_ADMIN_PERMISSION_CODES */
export const XDWX_ADMIN_PERMISSION_CODES = LMX_ADMIN_PERMISSION_CODES;
