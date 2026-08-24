import { Badge, Card, Descriptions, Tag, Typography } from "antd";
import type { JSX } from "react";
import type { SubscriptionInfo } from "../../types";

const { Title } = Typography;

const STATUS_MAP: Record<string, { badge: "success" | "processing" | "error" | "default"; label: string }> = {
	active: { badge: "success", label: "Active" },
	trial: { badge: "processing", label: "Trial" },
	expired: { badge: "error", label: "Expired" },
	cancelled: { badge: "default", label: "Cancelled" },
};

interface CurrentPlanCardProps {
	subscription: SubscriptionInfo | null;
	loading?: boolean;
}

export const CurrentPlanCard = ({ subscription, loading }: CurrentPlanCardProps): JSX.Element => {
	const statusCfg = STATUS_MAP[subscription?.status ?? ""] ?? { badge: "default" as const, label: "Unknown" };

	return (
		<Card loading={loading} className="border border-[var(--border)]">
			<div className="flex items-center justify-between mb-4">
				<Title level={5} className="mb-0">
					Current Subscription
				</Title>
				{subscription && <Badge status={statusCfg.badge} text={statusCfg.label} />}
			</div>

			{subscription ? (
				<Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" bordered>
					<Descriptions.Item label="Plan Tier">
						<Tag color="blue">{subscription.planTier}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Plan Name">{subscription.planName}</Descriptions.Item>
					<Descriptions.Item label="Monthly Token Limit">
						{subscription.tokenLimitMonthly === -1 ? "Unlimited" : subscription.tokenLimitMonthly.toLocaleString()}
					</Descriptions.Item>
					<Descriptions.Item label="Concurrency Limit">{subscription.concurrentLimit}</Descriptions.Item>
					<Descriptions.Item label="Start Date">{subscription.periodStart ?? "—"}</Descriptions.Item>
					<Descriptions.Item label="End Date">{subscription.periodEnd ?? "—"}</Descriptions.Item>
					<Descriptions.Item label="Features" span={3}>
						<div className="flex flex-wrap gap-1">
							{subscription.features.map((f) => (
								<Tag key={f}>{f}</Tag>
							))}
						</div>
					</Descriptions.Item>
				</Descriptions>
			) : (
				<div className="text-center py-8 text-[var(--muted-foreground)]">No subscription information</div>
			)}
		</Card>
	);
};
