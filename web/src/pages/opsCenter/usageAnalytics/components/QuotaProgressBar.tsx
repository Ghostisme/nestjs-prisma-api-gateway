import { Progress, Space, Typography } from "antd";
import type { JSX } from "react";
import type { QuotaStatus } from "../../types";

const { Text } = Typography;

interface QuotaProgressBarProps {
	data: QuotaStatus;
}

function formatTokenCount(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toString();
}

export default function QuotaProgressBar({ data }: QuotaProgressBarProps): JSX.Element {
	const strokeColor = data.usagePercent >= 90 ? "#ff4d4f" : data.usagePercent >= 70 ? "#faad14" : "#52c41a";

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Text strong>当前套餐：{data.planTier}</Text>
				<Text type="secondary">本月调用 {data.callsThisMonth.toLocaleString()} 次</Text>
			</div>

			<Progress
				percent={Math.round(data.usagePercent)}
				strokeColor={strokeColor}
				format={() => `${Math.round(data.usagePercent)}%`}
			/>

			<Space size="large">
				<Text type="secondary">已用 {formatTokenCount(data.tokenUsed)}</Text>
				<Text type="secondary">剩余 {formatTokenCount(data.tokenRemaining)}</Text>
				<Text type="secondary">总量 {formatTokenCount(data.tokenLimit)}</Text>
			</Space>
		</div>
	);
}
