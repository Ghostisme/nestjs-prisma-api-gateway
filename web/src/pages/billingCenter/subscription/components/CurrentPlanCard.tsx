import { Badge, Card, Descriptions, Tag, Typography } from "antd";
import type { JSX } from "react";
import type { SubscriptionInfo } from "../../types";

const { Title } = Typography;

const STATUS_MAP: Record<string, { badge: "success" | "processing" | "error" | "default"; label: string }> = {
	active: { badge: "success", label: "生效中" },
	trial: { badge: "processing", label: "试用中" },
	expired: { badge: "error", label: "已过期" },
	cancelled: { badge: "default", label: "已取消" },
};

interface CurrentPlanCardProps {
	subscription: SubscriptionInfo | null;
	loading?: boolean;
}

export const CurrentPlanCard = ({ subscription, loading }: CurrentPlanCardProps): JSX.Element => {
	const statusCfg = STATUS_MAP[subscription?.status ?? ""] ?? { badge: "default" as const, label: "未知" };

	return (
		<Card loading={loading} className="border border-[var(--border)]">
			<div className="flex items-center justify-between mb-4">
				<Title level={5} className="mb-0">
					当前订阅
				</Title>
				{subscription && <Badge status={statusCfg.badge} text={statusCfg.label} />}
			</div>

			{subscription ? (
				<Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" bordered>
					<Descriptions.Item label="套餐等级">
						<Tag color="blue">{subscription.planTier}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="套餐名称">{subscription.planName}</Descriptions.Item>
					<Descriptions.Item label="月 Token 限额">
						{subscription.tokenLimitMonthly === -1 ? "无限制" : subscription.tokenLimitMonthly.toLocaleString()}
					</Descriptions.Item>
					<Descriptions.Item label="并发限制">{subscription.concurrentLimit}</Descriptions.Item>
					<Descriptions.Item label="生效时间">{subscription.periodStart ?? "—"}</Descriptions.Item>
					<Descriptions.Item label="到期时间">{subscription.periodEnd ?? "—"}</Descriptions.Item>
					<Descriptions.Item label="包含功能" span={3}>
						<div className="flex flex-wrap gap-1">
							{subscription.features.map((f) => (
								<Tag key={f}>{f}</Tag>
							))}
						</div>
					</Descriptions.Item>
				</Descriptions>
			) : (
				<div className="text-center py-8 text-[var(--muted-foreground)]">暂无订阅信息</div>
			)}
		</Card>
	);
};
