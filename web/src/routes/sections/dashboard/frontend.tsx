import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

export function getFrontendDashboardRoutes(): RouteObject[] {
	const frontendDashboardRoutes: RouteObject[] = [
		{
			path: "ai-dashboard",
			children: [
				{
					index: true,
					element: <Navigate to="/ai-dashboard/user-dashboard" replace />,
				},
				{
					path: "user-dashboard",
					element: Component("/pages/aiDashboard/userDashboard"),
				},
				{
					path: "token-usage",
					element: Component("/pages/aiDashboard/tokenUsage"),
				},
				{
					path: "user-feedback",
					element: Component("/pages/aiDashboard/userFeedback"),
				},
			],
		},
		{
			path: "ai-management",
			children: [
				{
					index: true,
					element: <Navigate to="/ai-management/token-user-management" replace />,
				},
				{
					path: "token-user-management",
					element: Component("/pages/aiManagement/tokenUserManagement"),
				},
				{
					path: "token-system-management",
					element: Component("/pages/aiManagement/tokenSystemManagement"),
				},
				{
					path: "user-conversation-stats",
					element: Component("/pages/aiManagement/userConversationStats"),
				},
				{
					path: "banned-words",
					element: Component("/pages/aiManagement/bannedWords"),
				},
				{
					path: "conversation-view",
					element: Component("/pages/aiManagement/conversationView"),
				},
			],
		},
		{
			path: "ai-knowledge",
			children: [
				{
					index: true,
					element: <Navigate to="/ai-knowledge/knowledge-base" replace />,
				},
				{
					path: "knowledge-base",
					element: Component("/pages/aiKnowledgeBase"),
				},
			],
		},
		// Demo-only: Java-gateway /admin/* and /xdwx-material/* routes are not wired.
		// {
		// 	path: "sys-account-management",
		// 	children: [
		// 		{
		// 			path: "user-management",
		// 			element: Component("/pages/sys-account-management/user-management"),
		// 		},
		// 		{
		// 			path: "role-management",
		// 			element: Component("/pages/sys-account-management/role-management"),
		// 		},
		// 		{
		// 			path: "department-management",
		// 			element: Component("/pages/sys-account-management/department-management"),
		// 		},
		// 	],
		// },
		// {
		// 	path: "partner-enterprise",
		// 	children: [
		// 		{
		// 			index: true,
		// 			element: <Navigate to="/partner-enterprise/management" replace />,
		// 		},
		// 		{
		// 			path: "management",
		// 			element: Component("/pages/partnerEnterprise"),
		// 		},
		// 	],
		// },
		// {
		// 	path: "creation-agent",
		// 	children: [
		// 		{
		// 			index: true,
		// 			element: <Navigate to="/creation-agent/material-center" replace />,
		// 		},
		// 		{
		// 			path: "material-center",
		// 			element: Component("/pages/creationAgent/materialCenter"),
		// 		},
		// 		{
		// 			path: "tag-management",
		// 			element: Component("/pages/creationAgent/tagManagement"),
		// 		},
		// 		{
		// 			path: "car-model-management",
		// 			element: Component("/pages/creationAgent/carModelManagement"),
		// 		},
		// 	],
		// },
		{
			path: "error",
			children: [
				{ index: true, element: <Navigate to="403" replace /> },
				{ path: "403", element: Component("/pages/sys/error/Page403") },
				{ path: "404", element: Component("/pages/sys/error/Page404") },
				{ path: "500", element: Component("/pages/sys/error/Page500") },
			],
		},
	];
	return frontendDashboardRoutes;
}
