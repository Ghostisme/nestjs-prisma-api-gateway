import { Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Chart, useChart } from "@/components/chart";
import { AgentSelect } from "@/components/agentSelect";
import bffClient from "@/api/bffClient";
import aiDashboardService from "@/api/services/aiDashboardService";
import { ChartCard, DashboardFilterBar, StatCard } from "../components";
import type { DashboardFilter, FeedbackRecord, StatCardData } from "../types";

type FeedbackTab = "all" | "positive" | "negative";

export default function UserFeedbackPage(): JSX.Element {
	const [filter, setFilter] = useState<DashboardFilter>({
		model: "all",
		agent: "all",
		timeRange: "all",
	});
	const [activeTab, setActiveTab] = useState<FeedbackTab>("all");

	const { data: filterOpts } = useQuery({
		queryKey: ["dashboard-filter-options"],
		queryFn: () => bffClient.get<{ models: string[]; agents: string[] }>("/lumax/v1/dashboard/filter-options"),
		staleTime: 5 * 60 * 1000,
	});

	const { data, isLoading } = useQuery({
		queryKey: ["feedback-dashboard", filter],
		queryFn: () => aiDashboardService.getFeedbackDashboard(filter),
	});

	const handleFilterChange = useCallback((newFilter: DashboardFilter) => {
		setFilter(newFilter);
	}, []);

	const statCards: StatCardData[] = data
		? [
				{
					title: "Total Feedback",
					value: data.overview.totalFeedbacks.toLocaleString(),
					dayOverDay: data.overview.dayOverDay.totalFeedbacks,
				},
				{
					title: "Positive Rate",
					value: `${data.overview.positiveRate}%`,
					dayOverDay: data.overview.dayOverDay.positiveRate,
				},
				{
					title: "Negative Rate",
					value: `${data.overview.negativeRate}%`,
					dayOverDay: data.overview.dayOverDay.negativeRate,
				},
			]
		: [];

	const barOptions = useChart({
		chart: { type: "bar", stacked: false },
		xaxis: {
			categories: data?.feedbackStats.map((item) => item.date) ?? [],
		},
		colors: ["var(--colors-palette-success-default)", "var(--colors-palette-error-default)"],
		plotOptions: {
			bar: {
				columnWidth: "55%",
				borderRadius: 3,
				borderRadiusApplication: "end",
			},
		},
		legend: {
			show: false,
		},
		tooltip: {
			y: { formatter: (val: number) => `${val}` },
		},
	});

	const pieOptions = useChart({
		chart: { type: "pie" },
		labels: data?.feedbackDistribution.map((item) => item.name) ?? [],
		colors: ["var(--colors-palette-success-default)", "var(--colors-palette-error-default)"],
		legend: {
			show: true,
			position: "right",
			fontSize: "13px",
		},
		dataLabels: {
			enabled: true,
			formatter: (_val: number, opts: { seriesIndex: number; w: { config: { labels: string[] } } }) => {
				return opts.w.config.labels[opts.seriesIndex];
			},
		},
		plotOptions: {
			pie: {
				donut: { labels: { show: false } },
				expandOnClick: true,
			},
		},
	});

	const filteredRecords = useMemo(() => {
		if (!data?.feedbackRecords) return [];
		if (activeTab === "all") return data.feedbackRecords;
		return data.feedbackRecords.filter((r) => r.result === activeTab);
	}, [data?.feedbackRecords, activeTab]);

	const feedbackColumns = useMemo<ColumnsType<FeedbackRecord>>(
		() => [
			{
				title: "Result",
				dataIndex: "result",
				key: "result",
				width: 120,
				align: "center",
				render: (val: FeedbackRecord["result"]) =>
					val === "positive" ? (
						<Tag color="success" className="flex items-center gap-1 w-fit mx-auto">
							<span>👍</span> Helpful
						</Tag>
					) : (
						<Tag color="error" className="flex items-center gap-1 w-fit mx-auto">
							<span>👎</span> Not helpful
						</Tag>
					),
			},
			{
				title: "User Question",
				dataIndex: "userQuestion",
				key: "userQuestion",
				align: "center",
			},
			{
				title: "Agent",
				dataIndex: "agentName",
				key: "agentName",
				align: "center",
			},
			{
				title: "Time",
				dataIndex: "feedbackTime",
				key: "feedbackTime",
				width: 180,
				align: "center",
			},
		],
		[],
	);

	const tabs: { key: FeedbackTab; label: string }[] = [
		{ key: "all", label: "All" },
		{ key: "positive", label: "Positive" },
		{ key: "negative", label: "Negative" },
	];

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

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{statCards.map((card) => (
						<StatCard key={card.title} data={card} />
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
					<ChartCard title="Feedback Trend" className="lg:col-span-3">
						{data?.feedbackStats && (
							<Chart
								type="bar"
								height={300}
								options={barOptions}
								series={[
									{
										name: "Positive",
										data: data.feedbackStats.map((item) => item.positive),
									},
									{
										name: "Negative",
										data: data.feedbackStats.map((item) => item.negative),
									},
								]}
							/>
						)}
					</ChartCard>

					<ChartCard title="Feedback Distribution" className="lg:col-span-2">
						{data?.feedbackDistribution && (
							<Chart
								type="pie"
								height={300}
								options={pieOptions}
								series={data.feedbackDistribution.map((item) => item.value)}
							/>
						)}
					</ChartCard>
				</div>

				<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
					<div className="flex items-center gap-2 mb-4">
						{tabs.map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
									activeTab === tab.key
										? "bg-[var(--primary)] text-white shadow-sm"
										: "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					<Table<FeedbackRecord>
						columns={feedbackColumns}
						dataSource={filteredRecords}
						rowKey="id"
						pagination={{
							pageSize: 10,
							showTotal: (total) => `${total} records`,
						}}
						bordered
						size="middle"
					/>
				</div>
			</div>
		</Spin>
	);
}
