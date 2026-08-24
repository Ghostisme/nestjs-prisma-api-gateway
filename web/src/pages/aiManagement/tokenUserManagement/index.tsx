import { App, Button, Input, Select, Space, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { AuthGuard } from "@/components/auth/auth-guard";
import { getApiErrorMessage } from "@/utils/request-error";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import type { ModelTokenStat, QuotaOperationType, TokenUserRecord } from "../types";
import { QuotaManageModal } from "./components/QuotaManageModal";
import { QuotaRecordsModal } from "./components/QuotaRecordsModal";
import { ConsumptionDetailModal } from "./components/ConsumptionDetailModal";

export default function TokenUserManagementPage(): JSX.Element {
	const { message } = App.useApp();
	const queryClient = useQueryClient();

	const [quotaModalOpen, setQuotaModalOpen] = useState(false);
	const [recordsModalOpen, setRecordsModalOpen] = useState(false);
	const [consumptionModalOpen, setConsumptionModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<TokenUserRecord | null>(null);

	const [filterName, setFilterName] = useState("");
	const [filterDept, setFilterDept] = useState("");
	const [filterQuotaLimit, setFilterQuotaLimit] = useState<string | undefined>(undefined);
	const [searchParams, setSearchParams] = useState<Record<string, unknown>>({});

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["model-token-stats"],
		queryFn: () => aiManagementService.getModelTokenStats(),
	});

	const { data: userList, isLoading: listLoading } = useQuery({
		queryKey: ["token-user-list", searchParams],
		queryFn: () => aiManagementService.getTokenUserList(searchParams),
	});

	const handleSearch = useCallback(() => {
		const params: Record<string, unknown> = {};
		if (filterName.trim()) params.name = filterName.trim();
		if (filterDept.trim()) params.department = filterDept.trim();
		if (filterQuotaLimit) params.quotaLimit = filterQuotaLimit;
		setSearchParams(params);
	}, [filterName, filterDept, filterQuotaLimit]);

	const handleReset = useCallback(() => {
		setFilterName("");
		setFilterDept("");
		setFilterQuotaLimit(undefined);
		setSearchParams({});
	}, []);

	const handleOpenQuotaModal = useCallback((record: TokenUserRecord) => {
		setSelectedUser(record);
		setQuotaModalOpen(true);
	}, []);

	const handleOpenRecordsModal = useCallback((record: TokenUserRecord) => {
		setSelectedUser(record);
		setRecordsModalOpen(true);
	}, []);

	const handleOpenConsumptionModal = useCallback((record: TokenUserRecord) => {
		setSelectedUser(record);
		setConsumptionModalOpen(true);
	}, []);

	const handleQuotaConfirm = useCallback(
		async (type: QuotaOperationType, value?: number) => {
			if (!selectedUser) return;
			try {
				await aiManagementService.updateQuota(selectedUser.id, type, value);
				message.success("Quota updated");
				setQuotaModalOpen(false);
				queryClient.invalidateQueries({ queryKey: ["token-user-list"] });
				queryClient.invalidateQueries({ queryKey: ["model-token-stats"] });
			} catch (error) {
				message.error(getApiErrorMessage(error, "Failed to update quota"));
			}
		},
		[selectedUser, message, queryClient],
	);

	const columns = useMemo<ColumnsType<TokenUserRecord>>(
		() => [
			{ title: "ID", dataIndex: "id", width: 60, align: "center" },
			{ title: "Name", dataIndex: "name", width: 100, align: "center" },
			{
				title: "Department",
				dataIndex: "department",
				width: 160,
				align: "center",
				render: (v: string) => v || "-",
			},
			{
				title: "Total Quota",
				dataIndex: "tokenQuota",
				width: 120,
				align: "center",
				render: (v: number) => (v === -1 ? "∞" : v),
			},
			{
				title: "Used",
				dataIndex: "usedQuota",
				width: 120,
				align: "center",
			},
			{
				title: "Quota Limit",
				dataIndex: "quotaLimit",
				width: 90,
				align: "center",
				render: (v: string) => (v === "是" ? "Yes" : v === "否" ? "No" : v || "-"),
			},
			{
				title: "Satisfaction",
				dataIndex: "userSatisfaction",
				width: 100,
				align: "center",
				render: (v: string) => v || "-",
			},
			{
				title: "Last Used",
				dataIndex: "lastUsedTime",
				width: 170,
				align: "center",
			},
			{
				title: "Actions",
				width: 280,
				align: "center",
				fixed: "right",
				render: (_: unknown, record: TokenUserRecord) => (
					<Space>
						<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiManagement_tokenUserManagement_manageQuota}>
							<Button type="link" className="p-0" onClick={() => handleOpenQuotaModal(record)}>
								Manage Quota
							</Button>
						</AuthGuard>
						<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiManagement_tokenUserManagement_records}>
							<Button type="link" className="p-0" onClick={() => handleOpenRecordsModal(record)}>
								History
							</Button>
						</AuthGuard>
						<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiManagement_tokenUserManagement_consumption}>
							<Button type="link" className="p-0" onClick={() => handleOpenConsumptionModal(record)}>
								Usage Detail
							</Button>
						</AuthGuard>
					</Space>
				),
			},
		],
		[handleOpenQuotaModal, handleOpenRecordsModal, handleOpenConsumptionModal],
	);

	return (
		<Spin spinning={statsLoading || listLoading}>
			<div className="space-y-6">
				{/* Model Token Stats Cards */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
					{stats?.map((stat: ModelTokenStat) => (
						<div
							key={stat.modelName}
							className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]"
						>
							<div className="text-sm text-[var(--muted-foreground)] mb-1">{stat.modelName} · Total Tokens</div>
							<div className="text-2xl font-bold text-[var(--foreground)]">{stat.totalTokens.toLocaleString()}</div>
						</div>
					))}
				</div>

				{/* Search Filters */}
				<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)]">
					<div className="flex flex-wrap items-center gap-3 mb-4">
						<div className="flex items-center gap-1">
							<span className="text-sm shrink-0">Name</span>
							<Input
								placeholder="Search"
								className="w-28"
								size="middle"
								value={filterName}
								onChange={(e) => setFilterName(e.target.value)}
								allowClear
							/>
						</div>
						<div className="flex items-center gap-1">
							<span className="text-sm shrink-0">Department</span>
							<Input
								placeholder="Search"
								className="w-28"
								size="middle"
								value={filterDept}
								onChange={(e) => setFilterDept(e.target.value)}
								allowClear
							/>
						</div>
						<div className="flex items-center gap-1">
							<span className="text-sm shrink-0">Quota Limit</span>
							<Select
								placeholder="Select"
								className="w-24"
								options={[
									{ label: "Yes", value: "是" },
									{ label: "No", value: "否" },
								]}
								value={filterQuotaLimit}
								onChange={setFilterQuotaLimit}
								allowClear
							/>
						</div>
						<div className="flex items-center gap-1 ml-auto">
							<Button type="primary" onClick={handleSearch}>
								Search
							</Button>
							<Button onClick={handleReset}>Reset</Button>
						</div>
					</div>

					{/* Table */}
					<Table<TokenUserRecord>
						columns={columns}
						dataSource={userList?.records}
						rowKey="id"
						pagination={{
							pageSize: 10,
							total: userList?.total,
							showTotal: (total) => `${total} records`,
						}}
						bordered
						size="middle"
						scroll={{ x: "max-content" }}
					/>
				</div>

				{/* Modals */}
				<QuotaManageModal
					open={quotaModalOpen}
					onClose={() => setQuotaModalOpen(false)}
					userName={selectedUser?.name ?? ""}
					currentQuota={selectedUser?.tokenQuota ?? 0}
					currentRemaining={
						selectedUser ? (selectedUser.tokenQuota === -1 ? 0 : selectedUser.tokenQuota - selectedUser.usedQuota) : 0
					}
					onConfirm={handleQuotaConfirm}
				/>
				<QuotaRecordsModal
					open={recordsModalOpen}
					onClose={() => setRecordsModalOpen(false)}
					userId={selectedUser?.id ?? null}
				/>
				<ConsumptionDetailModal
					open={consumptionModalOpen}
					onClose={() => setConsumptionModalOpen(false)}
					userId={selectedUser?.id ?? null}
					userName={selectedUser?.name ?? ""}
				/>
			</div>
		</Spin>
	);
}
