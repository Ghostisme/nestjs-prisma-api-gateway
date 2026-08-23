import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

export function getCommercializationRoutes(): RouteObject[] {
	return [
		{
			path: "ops-center",
			children: [
				{
					index: true,
					element: <Navigate to="/ops-center/usage-analytics" replace />,
				},
				{
					path: "usage-analytics",
					element: Component("/pages/opsCenter/usageAnalytics"),
				},
				{
					path: "quota-management",
					element: Component("/pages/opsCenter/quotaManagement"),
				},
				{
					path: "agent-monitor",
					element: Component("/pages/opsCenter/agentMonitor"),
				},
				{
					path: "skills-ranking",
					element: Component("/pages/opsCenter/skillsRanking"),
				},
			],
		},
		{
			path: "developer-center",
			children: [
				{
					index: true,
					element: <Navigate to="/developer-center/api-keys" replace />,
				},
				{
					path: "api-keys",
					element: Component("/pages/developerCenter/apiKeys"),
				},
				{
					path: "models",
					element: Component("/pages/developerCenter/models"),
				},
			],
		},
		{
			path: "billing-center",
			children: [
				{
					index: true,
					element: <Navigate to="/billing-center/subscription" replace />,
				},
				{
					path: "subscription",
					element: Component("/pages/billingCenter/subscription"),
				},
				{
					path: "plans",
					element: Component("/pages/billingCenter/plans"),
				},
			],
		},
	];
}
