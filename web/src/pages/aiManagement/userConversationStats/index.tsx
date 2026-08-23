import { Button, Input, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import type { UserConversationRecord } from "../types";
import { ConversationDetailModal } from "./components/ConversationDetailModal";

type ConversationStatus = "completed" | "incomplete";

export default function UserConversationStatsPage(): JSX.Element {
	const [selectedUser, setSelectedUser] = useState<UserConversationRecord | null>(null);
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<ConversationStatus>("completed");

	const [filterName, setFilterName] = useState("");
	const [filterDept, setFilterDept] = useState("");
	const [searchParams, setSearchParams] = useState<Record<string, unknown>>({});

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["model-conversation-stats"],
		queryFn: () => aiManagementService.getConversationModelStats(),
	});

	const { data: userList, isLoading: listLoading } = useQuery({
		queryKey: ["conversation-user-list", searchParams, statusFilter],
		queryFn: () =>
			aiManagementService.getConversationUserList({
				...searchParams,
				status: statusFilter,
			}),
	});

	const handleOpenDetail = useCallback((record: UserConversationRecord) => {
		setSelectedUser(record);
		setDetailModalOpen(true);
	}, []);

	const handleSearch = useCallback(() => {
		const params: Record<string, unknown> = {};
		if (filterName.trim()) params.name = filterName.trim();
		if (filterDept.trim()) params.department = filterDept.trim();
		setSearchParams(params);
	}, [filterName, filterDept]);

	const handleReset = useCallback(() => {
		setFilterName("");
		setFilterDept("");
		setSearchParams({});
	}, []);

	const conversationStatCards = useMemo(() => {
		if (!stats) return [];
		return stats.map((s: { modelName: string; totalConversations: number }) => ({
			modelName: s.modelName,
			label: `${s.modelName}总对话数`,
			value: s.totalConversations,
		}));
	}, [stats]);

	const columns = useMemo<ColumnsType<UserConversationRecord>>(
		() => [
			{ title: "ID", dataIndex: "id", width: 60, align: "center" },
			{ title: "姓名", dataIndex: "name", width: 100, align: "center" },
			{
				title: "所属部门",
				dataIndex: "department",
				width: 180,
				align: "center",
				render: (v: string) => v || "-",
			},
			{
				title: "对话次数",
				dataIndex: "conversationCount",
				width: 100,
				align: "center",
				sorter: (a, b) => a.conversationCount - b.conversationCount,
			},
			{
				title: "用户满意度",
				dataIndex: "userSatisfaction",
				width: 100,
				align: "center",
			},
			{
				title: "最近对话时间",
				dataIndex: "lastConversationTime",
				width: 170,
				align: "center",
			},
			{
				title: "操作",
				width: 140,
				align: "center",
				fixed: "right",
				render: (_: unknown, record: UserConversationRecord) => (
					<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiManagement_userConversationStats_viewDetail}>
						<Button type="link" className="p-0" onClick={() => handleOpenDetail(record)}>
							查看对话明细
						</Button>
					</AuthGuard>
				),
			},
		],
		[handleOpenDetail],
	);

	return (
		<Spin spinning={statsLoading || listLoading}>
			<div className="space-y-6">
				{/* Model Stats Cards */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{conversationStatCards.map((stat) => (
						<div
							key={stat.modelName}
							className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]"
						>
							<div className="text-sm text-[var(--muted-foreground)] mb-1">{stat.label}</div>
							<div className="text-2xl font-bold text-[var(--foreground)]">{stat.value.toLocaleString()}</div>
						</div>
					))}
				</div>

				{/* Search + Table */}
				<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
					<div className="flex flex-wrap items-center gap-3 mb-4">
						<div className="flex items-center gap-1">
							<span className="text-sm shrink-0">姓名</span>
							<Input
								placeholder="请输入"
								className="w-28"
								size="middle"
								value={filterName}
								onChange={(e) => setFilterName(e.target.value)}
								allowClear
							/>
						</div>
						<div className="flex items-center gap-1">
							<span className="text-sm shrink-0">所属部门</span>
							<Input
								placeholder="请输入"
								className="w-28"
								size="middle"
								value={filterDept}
								onChange={(e) => setFilterDept(e.target.value)}
								allowClear
							/>
						</div>
						<div className="flex items-center gap-1">
							<button
								type="button"
								className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
									statusFilter === "completed"
										? "bg-[var(--primary)] text-white shadow-sm"
										: "bg-[var(--accent)] text-[var(--muted-foreground)]"
								}`}
								onClick={() => setStatusFilter("completed")}
							>
								已完
							</button>
							<button
								type="button"
								className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
									statusFilter === "incomplete"
										? "bg-[var(--primary)] text-white shadow-sm"
										: "bg-[var(--accent)] text-[var(--muted-foreground)]"
								}`}
								onClick={() => setStatusFilter("incomplete")}
							>
								未完
							</button>
						</div>
						<div className="flex items-center gap-1 ml-auto">
							<Button type="primary" onClick={handleSearch}>
								查询
							</Button>
							<Button onClick={handleReset}>重置</Button>
						</div>
					</div>

					<Table<UserConversationRecord>
						columns={columns}
						dataSource={userList?.records}
						rowKey="id"
						pagination={{
							pageSize: 10,
							total: userList?.total,
							showTotal: (total) => `共 ${total} 条数据`,
						}}
						bordered
						size="middle"
						scroll={{ x: "max-content" }}
					/>
				</div>

				{/* Conversation Detail Modal */}
				<ConversationDetailModal
					open={detailModalOpen}
					onClose={() => setDetailModalOpen(false)}
					userId={selectedUser?.id ?? null}
					userName={selectedUser?.name ?? ""}
				/>
			</div>
		</Spin>
	);
}
