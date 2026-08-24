import { Button, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Chart, useChart } from "@/components/chart";
import { AgentSelect } from "@/components/agentSelect";
import bffClient from "@/api/bffClient";
import { ChartCard, DashboardFilterBar } from "@/pages/aiDashboard/components";
import type { DashboardFilter } from "@/pages/aiDashboard/types";
import aiManagementService from "@/api/services/aiManagementService";
import { BANNED_WORD_CATEGORY_LABELS, type BannedWordCategoryRecord, RISK_LEVEL_LABELS } from "../types";
import { AddBannedWordModal } from "./components/AddBannedWordModal";
import { BannedWordListModal } from "./components/BannedWordListModal";
import { TriggerRecordsModal } from "./components/TriggerRecordsModal";

function useFilterOptions() {
	return useQuery({
		queryKey: ["dashboard-filter-options"],
		queryFn: () => bffClient.get<{ models: string[]; agents: string[] }>("/lumax/v1/dashboard/filter-options"),
		staleTime: 5 * 60 * 1000,
	});
}

export default function BannedWordsPage(): JSX.Element {
	const [filter, setFilter] = useState<DashboardFilter>({
		model: "all",
		agent: "all",
		timeRange: "all",
	});
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [listModalOpen, setListModalOpen] = useState(false);
	const [triggerModalOpen, setTriggerModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<BannedWordCategoryRecord | null>(null);

	const queryClient = useQueryClient();
	const { data: filterOpts } = useFilterOptions();

	const handleFilterChange = useCallback((newFilter: DashboardFilter) => {
		setFilter(newFilter);
	}, []);

	const { data: overview, isLoading: overviewLoading } = useQuery({
		queryKey: ["banned-word-overview", filter],
		queryFn: () => aiManagementService.getBannedWordOverview(filter),
	});

	const { data: distribution } = useQuery({
		queryKey: ["banned-word-distribution", filter],
		queryFn: () => aiManagementService.getCategoryDistribution(filter),
	});

	const { data: userRank } = useQuery({
		queryKey: ["banned-word-user-rank", filter],
		queryFn: () => aiManagementService.getUserBannedWordRank(filter),
	});

	const { data: categories, isLoading: categoriesLoading } = useQuery({
		queryKey: ["banned-word-categories", filter],
		queryFn: () => aiManagementService.getBannedWordCategories(),
	});

	const handleOpenWordList = useCallback((record: BannedWordCategoryRecord) => {
		setSelectedCategory(record);
		setListModalOpen(true);
	}, []);

	const handleOpenTriggerRecords = useCallback((record: BannedWordCategoryRecord) => {
		setSelectedCategory(record);
		setTriggerModalOpen(true);
	}, []);

	const pieOptions = useChart({
		chart: { type: "pie" },
		labels: distribution?.map((d) => BANNED_WORD_CATEGORY_LABELS[d.name] ?? d.name) ?? [],
		legend: {
			show: true,
			position: "top",
			horizontalAlign: "center",
		},
		dataLabels: {
			enabled: true,
			formatter: (_val: number, opts: { seriesIndex: number; w: { config: { labels: string[] } } }) =>
				opts.w.config.labels[opts.seriesIndex],
		},
		plotOptions: {
			pie: {
				donut: { labels: { show: false } },
				expandOnClick: true,
			},
		},
	});

	const barOptions = useChart({
		chart: { type: "bar" },
		xaxis: {
			categories: userRank?.map((r) => r.userName) ?? [],
		},
		plotOptions: {
			bar: {
				columnWidth: "55%",
				borderRadius: 3,
				borderRadiusApplication: "end",
			},
		},
		tooltip: {
			y: { formatter: (val: number) => `${val} times` },
		},
	});

	const categoryColumns = useMemo<ColumnsType<BannedWordCategoryRecord>>(
		() => [
			{ title: "ID", dataIndex: "id", width: 60, align: "center" },
			{
				title: "Category",
				dataIndex: "category",
				width: 120,
				align: "center",
				render: (v: string) => BANNED_WORD_CATEGORY_LABELS[v] ?? v,
			},
			{
				title: "Risk Level",
				dataIndex: "riskLevel",
				width: 100,
				align: "center",
				render: (v: string) => RISK_LEVEL_LABELS[v] ?? v,
			},
			{
				title: "Word Count",
				dataIndex: "wordCount",
				width: 120,
				align: "center",
				render: (val: number, record: BannedWordCategoryRecord) => (
					<Button type="link" className="p-0" onClick={() => handleOpenWordList(record)}>
						{val}
					</Button>
				),
			},
			{
				title: "Trigger Count",
				dataIndex: "triggerCount",
				width: 120,
				align: "center",
				render: (val: number, record: BannedWordCategoryRecord) => (
					<Button type="link" className="p-0" onClick={() => handleOpenTriggerRecords(record)}>
						{val}
					</Button>
				),
			},
		],
		[handleOpenWordList, handleOpenTriggerRecords],
	);

	return (
		<Spin spinning={overviewLoading || categoriesLoading}>
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

				{/* Stats + Charts Row */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
					{/* Left: stat cards */}
					<div className="lg:col-span-2 flex flex-col gap-4">
						<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
							<div className="text-sm text-[var(--muted-foreground)] mb-1">Total Banned Words</div>
							<div className="text-2xl font-bold text-[var(--foreground)]">{overview?.totalWords ?? 0}</div>
						</div>
						<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
							<div className="text-sm text-[var(--muted-foreground)] mb-1">Total User Triggers</div>
							<div className="text-2xl font-bold text-[var(--foreground)]">
								{overview?.totalUserTriggerCount.toLocaleString() ?? 0}
							</div>
						</div>
						<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
							<div className="text-sm text-[var(--muted-foreground)] mb-1">Total Intercepts</div>
							<div className="text-2xl font-bold text-[var(--foreground)]">
								{overview?.totalInterceptCount.toLocaleString() ?? 0}
							</div>
						</div>
					</div>

					{/* Center: Pie Chart */}
					<ChartCard title="Category Distribution" className="lg:col-span-5">
						{distribution && (
							<Chart type="pie" height={280} options={pieOptions} series={distribution.map((d) => d.value)} />
						)}
					</ChartCard>

					{/* Right: Bar Chart */}
					<ChartCard title="User Trigger Ranking" className="lg:col-span-5">
						{userRank && (
							<Chart
								type="bar"
								height={280}
								options={barOptions}
								series={[{ name: "Triggers", data: userRank.map((r) => r.count) }]}
							/>
						)}
					</ChartCard>
				</div>

				{/* Table Section */}
				<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
					<div className="flex items-center gap-2 mb-4">
						<Button type="primary" onClick={() => setAddModalOpen(true)}>
							Add Banned Word
						</Button>
						<Button
							danger
							disabled={!selectedCategory}
							onClick={() => {
								if (selectedCategory) {
									setListModalOpen(true);
								}
							}}
						>
							Manage Banned Words
						</Button>
					</div>

					<Table<BannedWordCategoryRecord>
						columns={categoryColumns}
						dataSource={categories}
						rowKey="id"
						pagination={false}
						bordered
						size="middle"
						onRow={(record) => ({
							onClick: () => setSelectedCategory(record),
							className: selectedCategory?.id === record.id ? "ant-table-row-selected" : "",
						})}
					/>
				</div>

				{/* Modals */}
				<AddBannedWordModal
					open={addModalOpen}
					onClose={() => setAddModalOpen(false)}
					onSuccess={() => {
						queryClient.invalidateQueries({
							queryKey: ["banned-word-overview"],
						});
						queryClient.invalidateQueries({
							queryKey: ["banned-word-distribution"],
						});
						queryClient.invalidateQueries({
							queryKey: ["banned-word-user-rank"],
						});
						queryClient.invalidateQueries({
							queryKey: ["banned-word-categories"],
						});
					}}
				/>
				<BannedWordListModal
					open={listModalOpen}
					onClose={() => setListModalOpen(false)}
					categoryId={selectedCategory?.id ?? null}
					categoryName={selectedCategory?.category ?? ""}
				/>
				<TriggerRecordsModal
					open={triggerModalOpen}
					onClose={() => setTriggerModalOpen(false)}
					categoryId={selectedCategory?.id ?? null}
					categoryName={selectedCategory?.category ?? ""}
				/>
			</div>
		</Spin>
	);
}
