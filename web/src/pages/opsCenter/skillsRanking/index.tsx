import { Card, Col, Row, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { JSX } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Chart, useChart } from "@/components/chart";
import agentMonitorService from "@/api/services/agentMonitorService";
import type { SkillRanking } from "../types";

const { Title } = Typography;

export default function SkillsRanking(): JSX.Element {
	const { data: rankings = [], isLoading } = useQuery<SkillRanking[]>({
		queryKey: ["skills-ranking"],
		queryFn: () => agentMonitorService.getSkillsRanking(),
	});

	const barOptions = useChart({
		chart: { type: "bar" },
		plotOptions: {
			bar: { horizontal: true, borderRadius: 4, barHeight: "60%", borderRadiusApplication: "end" },
		},
		xaxis: {
			categories: rankings.map((r) => r.skillName),
		},
		tooltip: {
			y: { formatter: (val: number) => `${val.toLocaleString()} 次` },
		},
	});

	const radarOptions = useChart({
		chart: { type: "radar" },
		xaxis: {
			categories: rankings.slice(0, 6).map((r) => r.skillName),
		},
		yaxis: { show: false },
		legend: {
			show: true,
			position: "top",
			horizontalAlign: "right",
			markers: { shape: "circle" },
		},
	});

	const successRateColor = (rate: number) => {
		if (rate >= 95) return "success";
		if (rate >= 90) return "processing";
		if (rate >= 85) return "warning";
		return "error";
	};

	const columns = useMemo<ColumnsType<SkillRanking>>(
		() => [
			{
				title: "排名",
				key: "rank",
				width: 60,
				align: "center",
				render: (_, __, idx) => {
					const colors = ["#f5222d", "#fa8c16", "#faad14"];
					return idx < 3 ? (
						<span className="font-bold" style={{ color: colors[idx] }}>
							{idx + 1}
						</span>
					) : (
						idx + 1
					);
				},
			},
			{
				title: "技能名称",
				dataIndex: "skillName",
				key: "skillName",
			},
			{
				title: "调用次数",
				dataIndex: "callsCount",
				key: "callsCount",
				align: "right",
				sorter: (a, b) => a.callsCount - b.callsCount,
				defaultSortOrder: "descend",
				render: (val: number) => val.toLocaleString(),
			},
			{
				title: "平均耗时",
				dataIndex: "avgDurationMs",
				key: "avgDurationMs",
				align: "right",
				sorter: (a, b) => a.avgDurationMs - b.avgDurationMs,
				render: (val: number) => `${(val / 1_000).toFixed(1)}s`,
			},
			{
				title: "平均 Token",
				dataIndex: "avgTokens",
				key: "avgTokens",
				align: "right",
				sorter: (a, b) => a.avgTokens - b.avgTokens,
				render: (val: number) => val.toLocaleString(),
			},
			{
				title: "成功率",
				dataIndex: "successRate",
				key: "successRate",
				align: "center",
				sorter: (a, b) => a.successRate - b.successRate,
				render: (val: number) => <Tag color={successRateColor(val)}>{val}%</Tag>,
			},
		],
		[],
	);

	const top6 = rankings.slice(0, 6);
	const maxCalls = Math.max(...top6.map((r) => r.callsCount));
	const maxDuration = Math.max(...top6.map((r) => r.avgDurationMs));
	const maxTokens = Math.max(...top6.map((r) => r.avgTokens));

	return (
		<Spin spinning={isLoading}>
			<div className="space-y-6">
				<Title level={4}>技能使用排行</Title>

				<Row gutter={[16, 16]}>
					<Col xs={24} lg={14}>
						<Card title="调用次数排行">
							<Chart
								type="bar"
								height={340}
								options={barOptions}
								series={[{ name: "调用次数", data: rankings.map((r) => r.callsCount) }]}
							/>
						</Card>
					</Col>
					<Col xs={24} lg={10}>
						<Card title="技能综合能力雷达图">
							<Chart
								type="radar"
								height={340}
								options={radarOptions}
								series={[
									{
										name: "调用量",
										data: top6.map((r) => Math.round((r.callsCount / maxCalls) * 100)),
									},
									{
										name: "响应速度",
										data: top6.map((r) => Math.round((1 - r.avgDurationMs / maxDuration) * 100)),
									},
									{
										name: "Token 效率",
										data: top6.map((r) => Math.round((1 - r.avgTokens / maxTokens) * 100)),
									},
								]}
							/>
						</Card>
					</Col>
				</Row>

				<Card title="技能详细数据">
					<Table<SkillRanking>
						columns={columns}
						dataSource={rankings}
						rowKey="skillName"
						pagination={false}
						size="middle"
						bordered
					/>
				</Card>
			</div>
		</Spin>
	);
}
