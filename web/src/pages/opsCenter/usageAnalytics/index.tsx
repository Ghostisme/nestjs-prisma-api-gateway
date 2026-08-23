import { Card, Col, Row, Spin, Statistic, Typography } from "antd";
import type { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiOutlined, ClockCircleOutlined, ThunderboltOutlined, KeyOutlined } from "@ant-design/icons";
import usageMeteringService from "@/api/services/usageMeteringService";
import UsageTrendChart from "./components/UsageTrendChart";
import ModelDistributionPie from "./components/ModelDistributionPie";
import TopUsersTable from "./components/TopUsersTable";
import QuotaProgressBar from "./components/QuotaProgressBar";
import type { QuotaStatus, UsageSummary } from "../types";

const { Title } = Typography;

const DEFAULT_SUMMARY: UsageSummary = {
	tokensIn: 0,
	tokensOut: 0,
	tokensTotal: 0,
	callsCount: 0,
	avgResponseTimeMs: 0,
};
const DEFAULT_QUOTA: QuotaStatus = {
	planTier: "-",
	tokenLimit: 0,
	tokenUsed: 0,
	tokenRemaining: 0,
	usagePercent: 0,
	callsThisMonth: 0,
	concurrentLimit: 0,
};

export default function UsageAnalytics(): JSX.Element {
	const { data: summary = DEFAULT_SUMMARY, isLoading: summaryLoading } = useQuery({
		queryKey: ["usage-summary"],
		queryFn: () => usageMeteringService.getSummary(),
	});
	const { data: trend = [], isLoading: trendLoading } = useQuery({
		queryKey: ["usage-trends"],
		queryFn: () => usageMeteringService.getTrends(),
	});
	const { data: models = [], isLoading: modelsLoading } = useQuery({
		queryKey: ["usage-by-model"],
		queryFn: () => usageMeteringService.getByModel(),
	});
	const { data: topUsers = [], isLoading: usersLoading } = useQuery({
		queryKey: ["usage-by-user"],
		queryFn: () => usageMeteringService.getByUser(),
	});
	const { data: quota = DEFAULT_QUOTA, isLoading: quotaLoading } = useQuery({
		queryKey: ["usage-quota-status"],
		queryFn: () => usageMeteringService.getQuotaStatus(),
	});

	const loading = summaryLoading || trendLoading || modelsLoading || usersLoading || quotaLoading;

	return (
		<Spin spinning={loading}>
			<div className="space-y-6">
				<Title level={4}>用量分析</Title>

				<Row gutter={[16, 16]}>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<Statistic
								title="Token 总消耗"
								value={summary.tokensTotal}
								prefix={<ThunderboltOutlined />}
								formatter={(val) => Number(val).toLocaleString()}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<Statistic
								title="输入 Token"
								value={summary.tokensIn}
								prefix={<KeyOutlined />}
								formatter={(val) => Number(val).toLocaleString()}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<Statistic
								title="调用次数"
								value={summary.callsCount}
								prefix={<ApiOutlined />}
								formatter={(val) => Number(val).toLocaleString()}
							/>
						</Card>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<Card>
							<Statistic
								title="平均响应时间"
								value={summary.avgResponseTimeMs}
								suffix="ms"
								prefix={<ClockCircleOutlined />}
								formatter={(val) => Number(val).toLocaleString()}
							/>
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]}>
					<Col xs={24} lg={16}>
						<Card title="Token 消耗趋势">
							<UsageTrendChart data={trend} />
						</Card>
					</Col>
					<Col xs={24} lg={8}>
						<Card title="模型用量分布">
							<ModelDistributionPie data={models} />
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]}>
					<Col xs={24} lg={14}>
						<Card title="用户用量排行 Top 10">
							<TopUsersTable data={topUsers} />
						</Card>
					</Col>
					<Col xs={24} lg={10}>
						<Card title="配额使用情况">
							<QuotaProgressBar data={quota} />
						</Card>
					</Col>
				</Row>
			</div>
		</Spin>
	);
}
