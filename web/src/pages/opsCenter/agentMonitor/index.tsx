import { Button, Card, Col, Input, Row, Select, Space, Spin, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	ReloadOutlined,
	SyncOutlined,
} from "@ant-design/icons";
import { Chart, useChart } from "@/components/chart";
import agentMonitorService from "@/api/services/agentMonitorService";
import type { AgentRunDashboard, AgentRunRecord } from "../types";

const { Title } = Typography;
const { Search } = Input;

const DEFAULT_DASHBOARD: AgentRunDashboard = {
	total: 0,
	completed: 0,
	failed: 0,
	running: 0,
	successRate: 0,
	avgDurationMs: 0,
	avgTokens: 0,
	errorDistribution: [],
};

const statusConfig: Record<string, { color: string; icon: JSX.Element }> = {
	completed: { color: "success", icon: <CheckCircleOutlined /> },
	running: { color: "processing", icon: <SyncOutlined spin /> },
	failed: { color: "error", icon: <CloseCircleOutlined /> },
	pending: { color: "default", icon: <ClockCircleOutlined /> },
};

export default function AgentMonitor(): JSX.Element {
	const queryClient = useQueryClient();
	const { data: dashboard = DEFAULT_DASHBOARD, isLoading: dashLoading } = useQuery({
		queryKey: ["agent-monitor-dashboard"],
		queryFn: () => agentMonitorService.getDashboard(),
	});
	const { data: runsData, isLoading: runsLoading } = useQuery({
		queryKey: ["agent-monitor-runs"],
		queryFn: () => agentMonitorService.getRuns(),
	});
	const records: AgentRunRecord[] = runsData?.items ?? [];
	const handleRefresh = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["agent-monitor-dashboard"] });
		queryClient.invalidateQueries({ queryKey: ["agent-monitor-runs"] });
	}, [queryClient]);

	const errorBarOptions = useChart({
		chart: { type: "bar" },
		plotOptions: {
			bar: {
				horizontal: true,
				borderRadius: 4,
				barHeight: "55%",
				borderRadiusApplication: "end",
			},
		},
		xaxis: {
			categories: dashboard.errorDistribution.map((e: { errorType: any }) => e.errorType),
		},
		colors: ["var(--colors-palette-error-default)"],
		tooltip: {
			y: { formatter: (val: number) => `${val} 次` },
		},
	});

	const columns = useMemo<ColumnsType<AgentRunRecord>>(
		() => [
			{
				title: "ID",
				dataIndex: "id",
				key: "id",
				width: 80,
			},
			{
				title: "Thread ID",
				dataIndex: "threadId",
				key: "threadId",
				width: 140,
				ellipsis: true,
			},
			{
				title: "Agent",
				dataIndex: "agentName",
				key: "agentName",
			},
			{
				title: "技能",
				dataIndex: "skillName",
				key: "skillName",
			},
			{
				title: "状态",
				dataIndex: "status",
				key: "status",
				width: 110,
				render: (val: string) => {
					const cfg = statusConfig[val] ?? statusConfig.pending;
					return (
						<Tag color={cfg.color} icon={cfg.icon}>
							{val}
						</Tag>
					);
				},
				filters: [
					{ text: "completed", value: "completed" },
					{ text: "running", value: "running" },
					{ text: "failed", value: "failed" },
				],
				onFilter: (value, record) => record.status === value,
			},
			{
				title: "耗时",
				dataIndex: "durationMs",
				key: "durationMs",
				align: "right",
				sorter: (a, b) => a.durationMs - b.durationMs,
				render: (val: number) => `${(val / 1_000).toFixed(1)}s`,
			},
			{
				title: "Token",
				dataIndex: "tokensTotal",
				key: "tokensTotal",
				align: "right",
				sorter: (a, b) => a.tokensTotal - b.tokensTotal,
				render: (val: number) => val.toLocaleString(),
			},
			{
				title: "错误类型",
				dataIndex: "errorType",
				key: "errorType",
				render: (val?: string) => (val ? <Tag color="error">{val}</Tag> : "-"),
			},
			{
				title: "开始时间",
				dataIndex: "startedAt",
				key: "startedAt",
				render: (val: string) => new Date(val).toLocaleString("zh-CN"),
			},
		],
		[],
	);

	return (
		<Spin spinning={dashLoading || runsLoading}>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Title level={4} className="!mb-0">
						Agent 执行监控
					</Title>
					<Button icon={<ReloadOutlined />} onClick={handleRefresh}>
						刷新
					</Button>
				</div>

				<Row gutter={[16, 16]}>
					<Col xs={12} sm={8} lg={4}>
						<Card>
							<Statistic title="总执行数" value={dashboard.total} formatter={(v) => Number(v).toLocaleString()} />
						</Card>
					</Col>
					<Col xs={12} sm={8} lg={4}>
						<Card>
							<Statistic
								title="已完成"
								value={dashboard.completed}
								valueStyle={{ color: "#52c41a" }}
								formatter={(v) => Number(v).toLocaleString()}
							/>
						</Card>
					</Col>
					<Col xs={12} sm={8} lg={4}>
						<Card>
							<Statistic
								title="失败"
								value={dashboard.failed}
								valueStyle={{ color: "#ff4d4f" }}
								formatter={(v) => Number(v).toLocaleString()}
							/>
						</Card>
					</Col>
					<Col xs={12} sm={8} lg={4}>
						<Card>
							<Statistic
								title="运行中"
								value={dashboard.running}
								prefix={<SyncOutlined spin />}
								valueStyle={{ color: "#1677ff" }}
							/>
						</Card>
					</Col>
					<Col xs={12} sm={8} lg={4}>
						<Card>
							<Statistic
								title="成功率"
								value={dashboard.successRate}
								suffix="%"
								prefix={<CheckCircleOutlined />}
								precision={1}
							/>
						</Card>
					</Col>
					<Col xs={12} sm={8} lg={4}>
						<Card>
							<Statistic
								title="平均耗时"
								value={(dashboard.avgDurationMs / 1_000).toFixed(1)}
								suffix="s"
								prefix={<ClockCircleOutlined />}
							/>
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]}>
					<Col xs={24} lg={10}>
						<Card title="错误类型分布">
							<Chart
								type="bar"
								height={260}
								options={errorBarOptions}
								series={[
									{
										name: "次数",
										data: dashboard.errorDistribution.map((e: { count: any }) => e.count),
									},
								]}
							/>
						</Card>
					</Col>
					<Col xs={24} lg={14}>
						<Card
							title="执行记录"
							extra={
								<Space>
									<Search placeholder="搜索 Agent / Thread" style={{ width: 200 }} allowClear />
									<Select
										defaultValue="all"
										style={{ width: 120 }}
										options={[
											{ label: "全部状态", value: "all" },
											{ label: "completed", value: "completed" },
											{ label: "running", value: "running" },
											{ label: "failed", value: "failed" },
										]}
									/>
								</Space>
							}
						>
							<Table<AgentRunRecord>
								columns={columns}
								dataSource={records}
								rowKey="id"
								size="small"
								bordered
								pagination={{
									pageSize: 8,
									size: "small",
									showTotal: (t) => `共 ${t} 条`,
								}}
								scroll={{ x: 900 }}
							/>
						</Card>
					</Col>
				</Row>
			</div>
		</Spin>
	);
}
