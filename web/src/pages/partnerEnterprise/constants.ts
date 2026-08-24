import type { DataNode } from "antd/es/tree";

export type PartnerEnterpriseProductFunction =
	/**
	 * 星动达人舱
	 */
	| "talent"
	/**
	 * 嘉鹿AI平台
	 */
	| "ai";

export const PARTNER_ENTERPRISE_STATUS_OPTIONS = [
	{ label: "Enabled", value: 0 },
	{ label: "Disabled", value: 1 },
];

export const PARTNER_ENTERPRISE_PRODUCT_FUNCTION_OPTIONS = [
	/**
	 * 星动达人舱
	 */
	{ label: "Talent Hub", value: "talent" },
	/**
	 * 嘉鹿AI平台
	 */
	{ label: "AI Platform", value: "ai" },
];

export const PARTNER_ENTERPRISE_USER_MODAL_MODE = {
	/**
	 * 创建企业账号
	 */
	CREATE: "create",
	/**
	 * 编辑企业账号
	 */
	EDIT: "edit",
	/**
	 * 查看企业账号
	 */
	VIEW: "view",
} as const;

export type PartnerEnterpriseUserModalMode =
	(typeof PARTNER_ENTERPRISE_USER_MODAL_MODE)[keyof typeof PARTNER_ENTERPRISE_USER_MODAL_MODE];

export const PARTNER_ENTERPRISE_USER_MODAL_TITLE_MAP: Record<PartnerEnterpriseUserModalMode, string> = {
	/**
	 * 创建企业账号
	 */
	[PARTNER_ENTERPRISE_USER_MODAL_MODE.CREATE]: "Create Account",
	/**
	 * 编辑企业账号
	 */
	[PARTNER_ENTERPRISE_USER_MODAL_MODE.EDIT]: "Edit Account",
	/**
	 * 查看企业账号
	 */
	[PARTNER_ENTERPRISE_USER_MODAL_MODE.VIEW]: "View Account",
};

export const PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP: Record<PartnerEnterpriseProductFunction, string> = {
	/**
	 * 星动达人舱
	 */
	talent: "talent",
	/**
	 * 嘉鹿AI平台
	 */
	ai: "ai",
};

export const PARTNER_ENTERPRISE_AI_FUNCTION_OPTIONS = [
	/**
	 * AI智能对话
	 */
	{ label: "AI Chat", value: 1001 },
	/**
	 * AI智能投流
	 */
	{ label: "AI Ad Delivery", value: 1002 },
	/**
	 * AI内容工厂
	 */
	{ label: "AI Content Factory", value: 1003 },
];

export const PARTNER_ENTERPRISE_LEGACY_AI_FUNCTION_CODE_MAP: Record<string, number> = {
	/**
	 * AI智能对话
	 */
	ai_dialog: 1001,
	/**
	 * AI智能投流
	 */
	ai_recognition: 1002,
	/**
	 * AI内容工厂
	 */
	ai_content_factory: 1003,
};

const PARTNER_ENTERPRISE_DEFAULT_BACKEND_MODULE_TREE: DataNode[] = [
	{
		title: "Select All",
		key: "all",
		children: [
			{ title: "AI Monitoring Dashboard", key: "ai_dashboard" },
			{ title: "AI Quality Management Center", key: "ai_management" },
			{ title: "AI Quality Knowledge Center", key: "ai_knowledge" },
			{ title: "Account Management Center", key: "account_management" },
		],
	},
];

export const PARTNER_ENTERPRISE_BACKEND_MODULE_TREE_MAP: Record<PartnerEnterpriseProductFunction, DataNode[]> = {
	/**
	 * 星动达人舱
	 */
	talent: PARTNER_ENTERPRISE_DEFAULT_BACKEND_MODULE_TREE,
	/**
	 * 嘉鹿AI平台
	 */
	ai: PARTNER_ENTERPRISE_DEFAULT_BACKEND_MODULE_TREE,
};

export const PARTNER_ENTERPRISE_ALL_MODULE_KEYS = [
	/**
	 * AI嘉鹿数据看板
	 */
	"ai_dashboard",
	/**
	 * AI嘉鹿管理中心
	 */
	"ai_management",
	/**
	 * AI嘉鹿知识中心
	 */
	"ai_knowledge",
	/**
	 * 账号管理中心
	 */
	"account_management",
];

export const PARTNER_ENTERPRISE_PRODUCT_FUNCTION_KEY_SET = new Set(
	PARTNER_ENTERPRISE_PRODUCT_FUNCTION_OPTIONS.map((option) => option.value),
);

export const PARTNER_ENTERPRISE_AI_FUNCTION_KEY_SET = new Set(
	PARTNER_ENTERPRISE_AI_FUNCTION_OPTIONS.map((option) => option.value),
);

export const PARTNER_ENTERPRISE_BACKEND_MODULE_KEY_SET = new Set(PARTNER_ENTERPRISE_ALL_MODULE_KEYS);
