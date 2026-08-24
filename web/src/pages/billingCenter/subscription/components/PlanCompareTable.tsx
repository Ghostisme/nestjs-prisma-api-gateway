import { Button, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useMemo } from "react";
import type { PlanConfig } from "../../types";

interface PlanCompareTableProps {
	plans: PlanConfig[];
	currentTier?: string;
	loading?: boolean;
	onSelect: (plan: PlanConfig) => void;
}

export const PlanCompareTable = ({ plans, currentTier, loading, onSelect }: PlanCompareTableProps): JSX.Element => {
	const columns = useMemo<ColumnsType<PlanConfig>>(
		() => [
			{
				title: "Plan",
				dataIndex: "name",
				width: 140,
				render: (name: string, record: PlanConfig) => (
					<div>
						<div className="font-medium">{name}</div>
						<div className="text-xs text-[var(--muted-foreground)]">{record.description}</div>
					</div>
				),
			},
			{
				title: "Tier",
				dataIndex: "tier",
				width: 100,
				align: "center",
				render: (tier: string) => {
					const colorMap: Record<string, string> = {
						free: "default",
						starter: "blue",
						pro: "gold",
						enterprise: "purple",
					};
					return <Tag color={colorMap[tier] ?? "default"}>{tier.toUpperCase()}</Tag>;
				},
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
			{
				title: "Concurrency Limit",
				dataIndex: "concurrentLimit",
				width: 100,
				align: "center",
			},
			{
				title: "Features",
				dataIndex: "features",
				width: 260,
				render: (features: string[]) => (
					<div className="flex flex-wrap gap-1">
						{features.map((f) => (
							<Tag key={f} className="text-xs">
								{f}
							</Tag>
						))}
					</div>
				),
			},
			{
				title: "Actions",
				width: 120,
				align: "center",
				fixed: "right",
				render: (_: unknown, record: PlanConfig) => {
					const isCurrent = record.tier === currentTier;
					if (isCurrent) {
						return (
							<Tag color="green" className="m-0">
								Current Plan
							</Tag>
						);
					}
					return (
						<Button type="primary" size="small" onClick={() => onSelect(record)}>
							Select
						</Button>
					);
				},
			},
		],
		[currentTier, onSelect],
	);

	return (
		<Table<PlanConfig>
			columns={columns}
			dataSource={plans}
			rowKey="id"
			loading={loading}
			pagination={false}
			bordered
			size="middle"
			scroll={{ x: "max-content" }}
		/>
	);
};
