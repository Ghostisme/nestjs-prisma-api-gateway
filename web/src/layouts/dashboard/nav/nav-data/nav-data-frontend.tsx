import { Icon } from "@/components/icon";
import type { NavProps } from "@/components/nav";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";

export const frontendNavData: NavProps["data"] = [
	{
		items: [
			{
				title: "AI Dashboard",
				path: "/ai-dashboard",
				icon: <Icon icon="local:ic-analysis" size="24" />,
				children: [
					{
						title: "User Analytics",
						path: "/ai-dashboard/user-dashboard",
						auth: [LMX_ADMIN_PERMISSIONS.aiDashboard_userDashboard],
					},
					{
						title: "Token Usage",
						path: "/ai-dashboard/token-usage",
						auth: [LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage],
					},
					{
						title: "User Feedback",
						path: "/ai-dashboard/user-feedback",
						auth: [LMX_ADMIN_PERMISSIONS.aiDashboard_userFeedback],
					},
				],
			},
		],
	},
	{
		items: [
			{
				title: "AI Management",
				path: "/ai-management",
				icon: <Icon icon="local:ic-setting" size="24" />,
				children: [
					{
						title: "Token & Quota Management",
						path: "/ai-management/token-user-management",
						auth: [LMX_ADMIN_PERMISSIONS.aiManagement_tokenUserManagement],
					},
					{
						title: "Token System Config",
						path: "/ai-management/token-system-management",
						auth: [LMX_ADMIN_PERMISSIONS.aiManagement_tokenSystemManagement],
					},
					{
						title: "Conversation Analytics",
						path: "/ai-management/user-conversation-stats",
						auth: [LMX_ADMIN_PERMISSIONS.aiManagement_userConversationStats],
					},
					{
						title: "Safety Audit",
						path: "/ai-management/banned-words",
						auth: [LMX_ADMIN_PERMISSIONS.aiManagement_bannedWords],
					},
				],
			},
		],
	},
	{
		items: [
			{
				title: "Knowledge",
				path: "/ai-knowledge",
				icon: <Icon icon="local:ic-analysis" size="24" />,
				children: [
					{
						title: "RAG Knowledge Base",
						path: "/ai-knowledge/knowledge-base",
						auth: [LMX_ADMIN_PERMISSIONS.aiKnowledge_knowledgeBase],
					},
				],
			},
		],
	},
	// Demo-only: hide Java-gateway /admin/* and /xdwx-material/* pages.
	// Keep the page files; they are not wired into this NestJS BFF demo.
	// {
	// 	items: [
	// 		{
	// 			title: "Account Management",
	// 			path: "sys-account-management",
	// 			icon: <Icon icon="local:ic-setting" size="24" />,
	// 			children: [
	// 				{
	// 					title: "User Management",
	// 					path: "sys-account-management/user-management",
	// 					auth: [LMX_ADMIN_PERMISSIONS.user_read],
	// 				},
	// 				{
	// 					title: "Role Management",
	// 					path: "sys-account-management/role-management",
	// 					auth: [LMX_ADMIN_PERMISSIONS.role_read],
	// 				},
	// 				{
	// 					title: "Department Management",
	// 					path: "sys-account-management/department-management",
	// 					auth: [LMX_ADMIN_PERMISSIONS.dept_read],
	// 				},
	// 			],
	// 		},
	// 	],
	// },
	// {
	// 	items: [
	// 		{
	// 			title: "Partner Enterprises",
	// 			path: "/partner-enterprise",
	// 			icon: <Icon icon="local:ic-setting" size="24" />,
	// 			children: [
	// 				{
	// 					title: "Partner Enterprises",
	// 					path: "/partner-enterprise/management",
	// 					auth: [LMX_ADMIN_PERMISSIONS.partner_read],
	// 				},
	// 			],
	// 		},
	// 	],
	// },
	// {
	// 	items: [
	// 		{
	// 			title: "Creation Studio",
	// 			path: "/creation-agent",
	// 			icon: <Icon icon="local:ic-analysis" size="24" />,
	// 			children: [
	// 				{
	// 					title: "Material Center",
	// 					path: "/creation-agent/material-center",
	// 				},
	// 				{
	// 					title: "Tag Management",
	// 					path: "/creation-agent/tag-management",
	// 				},
	// 				{
	// 					title: "Car Models",
	// 					path: "/creation-agent/car-model-management",
	// 				},
	// 			],
	// 		},
	// 	],
	// },
	// {
	// 	items: [
	// 		{
	// 			title: "Other",
	// 			path: "/other",
	// 			icon: <Icon icon="local:ic-setting" size="24" />,
	// 			children: [
	// 				{ title: "用量分析", path: "/ops-center/usage-analytics" },
	// 				{ title: "配额管理", path: "/ops-center/quota-management" },
	// 				{ title: "Agent监控", path: "/ops-center/agent-monitor" },
	// 				{ title: "Skills排行", path: "/ops-center/skills-ranking" },
	// 				{ title: "API Key管理", path: "/developer-center/api-keys" },
	// 				{ title: "模型管理", path: "/developer-center/models" },
	// 				{ title: "订阅管理", path: "/billing-center/subscription" },
	// 				{ title: "套餐配置", path: "/billing-center/plans" },
	// 			],
	// 		},
	// 	],
	// },
];
