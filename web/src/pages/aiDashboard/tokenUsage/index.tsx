import { Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Chart, useChart } from "@/components/chart";
import { AgentSelect } from "@/components/agentSelect";
import bffClient from "@/api/bffClient";
import aiDashboardService from "@/api/services/aiDashboardService";
import { ChartCard, DashboardFilterBar, StatCard } from "../components";
import type { AgentConsumptionItem, DashboardFilter, StatCardData } from "../types";

function formatTokenCount(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)} M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(0)} K`;
	return num.toString();
}

export default function TokenUsagePage(): JSX.Element {
	const [filter, setFilter] = useState<DashboardFilter>({
		model: "all",
		agent: "all",
		timeRange: "all",
	});

	const { data: filterOpts } = useQuery({
		queryKey: ["dashboard-filter-options"],
		queryFn: () => bffClient.get<{ models: string[]; agents: string[] }>("/lumax/v1/dashboard/filter-options"),
		staleTime: 5 * 60 * 1000,
	});

	const { data, isLoading } = useQuery({
		queryKey: ["token-dashboard", filter],
		queryFn: () => aiDashboardService.getTokenDashboard(filter),
	});

	const handleFilterChange = useCallback((newFilter: DashboardFilter) => {
		setFilter(newFilter);
	}, []);

	const statCards: StatCardData[] = data
		? [
				{
					title: "Total Tokens",
					value: formatTokenCount(data.overview.totalTokens),
					dayOverDay: data.overview.dayOverDay.totalTokens,
				},
				{
					title: "Input Tokens",
					value: formatTokenCount(data.overview.inputTokens),
					dayOverDay: data.overview.dayOverDay.inputTokens,
				},
				{
					title: "Output Tokens",
					value: formatTokenCount(data.overview.outputTokens),
					dayOverDay: data.overview.dayOverDay.outputTokens,
				},
				{
					title: "Compute Cost",
					value: data.overview.totalCost.toLocaleString(),
					prefix: "¥",
					dayOverDay: data.overview.dayOverDay.totalCost,
				},
			]
		: [];

	const horizontalBarOptions = useChart({
		chart: { type: "bar" },
		plotOptions: {
			bar: {
				horizontal: true,
				borderRadius: 4,
				barHeight: "60%",
				borderRadiusApplication: "end",
			},
		},
		xaxis: {
			categories: data?.userTokenUsage.map((item) => item.username) ?? [],
		},
		tooltip: {
			y: { formatter: (val: number) => `${val.toLocaleString()} tokens` },
		},
	});

	const areaOptions = useChart({
		chart: { type: "area" },
		xaxis: {
			categories: data?.tokenTrend.map((item) => item.date) ?? [],
		},
		stroke: { curve: "smooth", width: 2.5 },
		colors: ["var(--colors-palette-info-default)", "var(--colors-palette-error-default)"],
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.3,
				opacityTo: 0.05,
				stops: [0, 100],
			},
		},
		legend: {
			show: true,
			position: "top",
			horizontalAlign: "right",
			markers: { shape: "circle" },
		},
		tooltip: {
			y: { formatter: (val: number) => `${val.toLocaleString()}` },
		},
	});

	const agentColumns = useMemo<ColumnsType<AgentConsumptionItem>>(
		() => [
			{
				title: "Agent",
				dataIndex: "agentName",
				key: "agentName",
				align: "center",
			},
			{
				title: "Model",
				dataIndex: "model",
				key: "model",
				align: "center",
			},
			{
				title: "Tokens",
				dataIndex: "tokens",
				key: "tokens",
				align: "center",
				render: (val: number) => val.toLocaleString(),
				sorter: (a, b) => a.tokens - b.tokens,
			},
			{
				title: "Avg. Response Time",
				dataIndex: "avgResponseTime",
				key: "avgResponseTime",
				align: "center",
			},
		],
		[],
	);

	return (
		<Spin spinning={isLoading}>
			<div className="space-y-6">
				<DashboardFilterBar
					onFilterChange={handleFilterChange}
					modelOptions={[
						{ label: "All Models", value: "all" },
						...(filterOpts?.models?.map((m) => ({ label: m, value: m })) ?? []),
					]}
					renderAgentSelect={({ value, onChange }) => (
						<AgentSelect
							value={value}
							onChange={(selectedValue) => onChange(selectedValue)}
							prependOptions={[{ label: "All Agents", value: "all" }]}
							allowClear={false}
							className="w-36"
							size="middle"
						/>
					)}
				/>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{statCards.map((card) => (
						<StatCard key={card.title} data={card} />
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<ChartCard title="Token Usage by User">
						{data?.userTokenUsage && (
							<Chart
								type="bar"
								height={350}
								options={horizontalBarOptions}
								series={[
									{
										name: "Tokens",
										data: data.userTokenUsage.map((item) => item.tokens),
									},
								]}
							/>
						)}
					</ChartCard>

					<ChartCard title="Token Consumption Trend">
						{data?.tokenTrend && (
							<Chart
								type="area"
								height={350}
								options={areaOptions}
								series={[
									{
										name: "Input",
										data: data.tokenTrend.map((item) => item.input),
									},
									{
										name: "Output",
										data: data.tokenTrend.map((item) => item.output),
									},
								]}
							/>
						)}
					</ChartCard>
				</div>

				<ChartCard title="Consumption by Agent">
					<Table<AgentConsumptionItem>
						columns={agentColumns}
						dataSource={data?.agentConsumption}
						rowKey="agentName"
						pagination={false}
						bordered
						size="middle"
					/>
				</ChartCard>
			</div>
		</Spin>
	);
}
