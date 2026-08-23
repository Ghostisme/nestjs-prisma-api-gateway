import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { type JSX, useCallback, useState } from "react";
import bffClient from "@/api/bffClient";
import aiDashboardService from "@/api/services/aiDashboardService";
import { AgentSelect } from "@/components/agentSelect";
import { Chart, useChart } from "@/components/chart";
import { ChartCard, DashboardFilterBar, StatCard } from "../components";
import type { DashboardFilter, StatCardData } from "../types";

function useFilterOptions() {
	return useQuery({
		queryKey: ["dashboard-filter-options"],
		queryFn: () => bffClient.get<{ models: string[]; agents: string[] }>("/lumax/v1/dashboard/filter-options"),
		staleTime: 5 * 60 * 1000,
	});
}

export default function UserDashboardPage(): JSX.Element {
	const [filter, setFilter] = useState<DashboardFilter>({
		model: "all",
		agent: "all",
		timeRange: "all",
	});

	const { data: filterOpts } = useFilterOptions();

	const { data, isLoading } = useQuery({
		queryKey: ["user-dashboard", filter],
		queryFn: () => aiDashboardService.getUserDashboard(filter),
	});

	const handleFilterChange = useCallback((newFilter: DashboardFilter) => {
		setFilter(newFilter);
	}, []);

	const statCards: StatCardData[] = data
		? [
				{
					title: "Total Conversations",
					value: data.overview.totalConversations.toLocaleString(),
					dayOverDay: data.overview.dayOverDay.conversations,
				},
				{
					title: "Total Users",
					value: data.overview.totalUsers.toLocaleString(),
					dayOverDay: data.overview.dayOverDay.users,
				},
				{
					title: "Active Users",
					value: data.overview.activeUsers.toLocaleString(),
					dayOverDay: data.overview.dayOverDay.activeUsers,
				},
				{
					title: "Satisfaction Rate",
					value: `${data.overview.satisfactionRate}%`,
					dayOverDay: data.overview.dayOverDay.satisfaction,
				},
			]
		: [];

	const pieOptions = useChart({
		chart: { type: "pie" },
		labels: data?.modelUsage.map((item) => item.name) ?? [],
		legend: {
			show: true,
			position: "top",
			horizontalAlign: "center",
		},
		tooltip: {
			y: { formatter: (val: number) => `${val}` },
		},
		plotOptions: {
			pie: {
				donut: { labels: { show: false } },
				expandOnClick: true,
			},
		},
		dataLabels: {
			enabled: true,
			formatter: (_val: number, opts: { seriesIndex: number; w: { config: { labels: string[] } } }) => {
				return opts.w.config.labels[opts.seriesIndex];
			},
		},
	});

	const barOptions = useChart({
		chart: { type: "bar" },
		xaxis: {
			categories: data?.responseTime.map((item) => item.range) ?? [],
		},
		plotOptions: {
			bar: {
				columnWidth: "50%",
				borderRadius: 4,
				borderRadiusApplication: "end",
			},
		},
		tooltip: {
			y: { formatter: (val: number) => `${val}` },
		},
	});

	const lineOptions = useChart({
		chart: { type: "area" },
		xaxis: {
			categories: data?.activityTrend.map((item) => item.date) ?? [],
		},
		stroke: { curve: "smooth", width: 2.5 },
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.4,
				opacityTo: 0.05,
				stops: [0, 100],
			},
		},
		tooltip: {
			y: { formatter: (val: number) => `${val}` },
		},
	});

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
					<ChartCard title="Model Usage">
						{data?.modelUsage && (
							<Chart type="pie" height={300} options={pieOptions} series={data.modelUsage.map((item) => item.value)} />
						)}
					</ChartCard>

					<ChartCard title="Response Time Distribution">
						{data?.responseTime && (
							<Chart
								type="bar"
								height={300}
								options={barOptions}
								series={[
									{
										name: "Requests",
										data: data.responseTime.map((item) => item.count),
									},
								]}
							/>
						)}
					</ChartCard>
				</div>

				<ChartCard title="Active Users Trend">
					{data?.activityTrend && (
						<Chart
							type="area"
							height={300}
							options={lineOptions}
							series={[
								{
									name: "Active Users",
									data: data.activityTrend.map((item) => item.value),
								},
							]}
						/>
					)}
				</ChartCard>
			</div>
		</Spin>
	);
}
