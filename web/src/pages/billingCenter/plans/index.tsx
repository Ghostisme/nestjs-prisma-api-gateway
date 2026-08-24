import { App, Button, Card, Descriptions, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import subscriptionService from "@/api/services/subscriptionService";
import { getApiErrorMessage } from "@/utils/request-error";
import type { PlanConfig } from "../types";

const TIER_COLORS: Record<string, string> = {
	free: "default",
	starter: "blue",
	pro: "gold",
	enterprise: "purple",
};

export default function PlansPage(): JSX.Element {
	const { message } = App.useApp();
	const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);

	const { data: plans, isLoading } = useQuery({
		queryKey: ["plan-configs"],
		queryFn: () => subscriptionService.getPlans(),
	});

	const handleToggleStatus = async (plan: PlanConfig) => {
		try {
			const next = plan.status === "active" ? "inactive" : "active";
			await subscriptionService.updatePlanStatus(plan.id, next);
			message.success(`${next === "active" ? "Enabled" : "Disabled"} ${plan.name}`);
		} catch (error) {
			message.error(getApiErrorMessage(error, "Operation failed"));
		}
	};

	const columns = useMemo<ColumnsType<PlanConfig>>(
		() => [
			{ title: "Order", dataIndex: "sortOrder", width: 70, align: "center" },
			{ title: "Plan Name", dataIndex: "name", width: 120 },
			{
				title: "Tier",
				dataIndex: "tier",
				width: 110,
				align: "center",
				render: (tier: string) => <Tag color={TIER_COLORS[tier] ?? "default"}>{tier.toUpperCase()}</Tag>,
			},
			{
				title: "Monthly Price (¥)",
				dataIndex: "priceMonthly",
				width: 120,
				align: "right",
				render: (v: number) => (v === 0 ? "Free" : `¥${v.toLocaleString()}`),
			},
			{
				title: "Monthly Token Limit",
				dataIndex: "tokenLimitMonthly",
				width: 140,
				align: "right",
				render: (v: number) => (v === -1 ? "Unlimited" : v.toLocaleString()),
			},
			{ title: "Concurrency Limit", dataIndex: "concurrentLimit", width: 100, align: "center" },
			{ title: "Description", dataIndex: "description", width: 180, ellipsis: true },
			{
				title: "Status",
				dataIndex: "status",
				width: 90,
				align: "center",
				render: (s: string) => (
					<Tag color={s === "active" ? "green" : "default"}>{s === "active" ? "Enabled" : "Disabled"}</Tag>
				),
			},
			{
				title: "Actions",
				width: 160,
				fixed: "right",
				align: "center",
				render: (_: unknown, record: PlanConfig) => (
					<Space>
						<Button type="link" className="p-0" onClick={() => setSelectedPlan(record)}>
							View
						</Button>
						<Popconfirm
							title={`${record.status === "active" ? "Disable" : "Enable"} this plan?`}
							onConfirm={() => handleToggleStatus(record)}
						>
							<Button type="link" className="p-0" danger={record.status === "active"}>
								{record.status === "active" ? "Disable" : "Enable"}
							</Button>
						</Popconfirm>
					</Space>
				),
			},
		],
		[],
	);

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold text-[var(--foreground)]">Plan Configuration</h2>

			<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
				<Table<PlanConfig>
					columns={columns}
					dataSource={plans}
					rowKey="id"
					loading={isLoading}
					pagination={false}
					bordered
					size="middle"
					scroll={{ x: "max-content" }}
				/>
			</div>

			{selectedPlan && (
				<Card
					title={`Plan Details — ${selectedPlan.name}`}
					extra={
						<Button type="link" onClick={() => setSelectedPlan(null)}>
							Close
						</Button>
					}
					className="border border-[var(--border)]"
				>
					<Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
						<Descriptions.Item label="Plan Name">{selectedPlan.name}</Descriptions.Item>
						<Descriptions.Item label="Tier">
							<Tag color={TIER_COLORS[selectedPlan.tier]}>{selectedPlan.tier.toUpperCase()}</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Monthly Price">
							{selectedPlan.priceMonthly === 0 ? "Free" : `¥${selectedPlan.priceMonthly}`}
						</Descriptions.Item>
						<Descriptions.Item label="Monthly Token Limit">
							{selectedPlan.tokenLimitMonthly === -1 ? "Unlimited" : selectedPlan.tokenLimitMonthly.toLocaleString()}
						</Descriptions.Item>
						<Descriptions.Item label="Concurrency Limit">{selectedPlan.concurrentLimit}</Descriptions.Item>
						<Descriptions.Item label="Description">{selectedPlan.description}</Descriptions.Item>
						<Descriptions.Item label="Features" span={2}>
							<div className="flex flex-wrap gap-1">
								{selectedPlan.features.map((f) => (
									<Tag key={f}>{f}</Tag>
								))}
							</div>
						</Descriptions.Item>
					</Descriptions>
				</Card>
			)}
		</div>
	);
}
