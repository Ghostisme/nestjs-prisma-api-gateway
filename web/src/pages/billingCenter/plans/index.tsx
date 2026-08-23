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
			message.success(`已${next === "active" ? "启用" : "停用"} ${plan.name}`);
		} catch (error) {
			message.error(getApiErrorMessage(error, "操作失败"));
		}
	};

	const columns = useMemo<ColumnsType<PlanConfig>>(
		() => [
			{ title: "排序", dataIndex: "sortOrder", width: 70, align: "center" },
			{ title: "套餐名称", dataIndex: "name", width: 120 },
			{
				title: "等级",
				dataIndex: "tier",
				width: 110,
				align: "center",
				render: (tier: string) => <Tag color={TIER_COLORS[tier] ?? "default"}>{tier.toUpperCase()}</Tag>,
			},
			{
				title: "月费（元）",
				dataIndex: "priceMonthly",
				width: 120,
				align: "right",
				render: (v: number) => (v === 0 ? "免费" : `¥${v.toLocaleString()}`),
			},
			{
				title: "月 Token 限额",
				dataIndex: "tokenLimitMonthly",
				width: 140,
				align: "right",
				render: (v: number) => (v === -1 ? "无限制" : v.toLocaleString()),
			},
			{ title: "并发限制", dataIndex: "concurrentLimit", width: 100, align: "center" },
			{ title: "描述", dataIndex: "description", width: 180, ellipsis: true },
			{
				title: "状态",
				dataIndex: "status",
				width: 90,
				align: "center",
				render: (s: string) => (
					<Tag color={s === "active" ? "green" : "default"}>{s === "active" ? "启用" : "停用"}</Tag>
				),
			},
			{
				title: "操作",
				width: 160,
				fixed: "right",
				align: "center",
				render: (_: unknown, record: PlanConfig) => (
					<Space>
						<Button type="link" className="p-0" onClick={() => setSelectedPlan(record)}>
							查看
						</Button>
						<Popconfirm
							title={`确认${record.status === "active" ? "停用" : "启用"}该套餐？`}
							onConfirm={() => handleToggleStatus(record)}
						>
							<Button type="link" className="p-0" danger={record.status === "active"}>
								{record.status === "active" ? "停用" : "启用"}
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
			<h2 className="text-lg font-semibold text-[var(--foreground)]">套餐配置</h2>

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
					title={`套餐详情 — ${selectedPlan.name}`}
					extra={
						<Button type="link" onClick={() => setSelectedPlan(null)}>
							关闭
						</Button>
					}
					className="border border-[var(--border)]"
				>
					<Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
						<Descriptions.Item label="套餐名称">{selectedPlan.name}</Descriptions.Item>
						<Descriptions.Item label="等级">
							<Tag color={TIER_COLORS[selectedPlan.tier]}>{selectedPlan.tier.toUpperCase()}</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="月费">
							{selectedPlan.priceMonthly === 0 ? "免费" : `¥${selectedPlan.priceMonthly}`}
						</Descriptions.Item>
						<Descriptions.Item label="月 Token 限额">
							{selectedPlan.tokenLimitMonthly === -1 ? "无限制" : selectedPlan.tokenLimitMonthly.toLocaleString()}
						</Descriptions.Item>
						<Descriptions.Item label="并发限制">{selectedPlan.concurrentLimit}</Descriptions.Item>
						<Descriptions.Item label="描述">{selectedPlan.description}</Descriptions.Item>
						<Descriptions.Item label="包含功能" span={2}>
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
