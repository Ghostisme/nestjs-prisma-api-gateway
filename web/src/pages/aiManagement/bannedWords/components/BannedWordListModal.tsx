import { App, Button, Input, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { getApiErrorMessage } from "@/utils/request-error";
import { BANNED_WORD_CATEGORY_LABELS, BANNED_WORD_STATUS_LABELS, type BannedWordItem } from "../../types";

interface BannedWordListModalProps {
	open: boolean;
	onClose: () => void;
	categoryId: number | null;
	categoryName: string;
}

export const BannedWordListModal = ({
	open,
	onClose,
	categoryId,
	categoryName,
}: BannedWordListModalProps): JSX.Element => {
	const { message, modal } = App.useApp();
	const queryClient = useQueryClient();

	const [searchName, setSearchName] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

	const { data, isLoading } = useQuery({
		queryKey: ["banned-word-list", categoryId],
		queryFn: () => aiManagementService.getBannedWordList(categoryId ?? undefined),
		enabled: open && categoryId !== null,
	});

	const filteredRecords = useMemo(() => {
		let records = data?.records ?? [];
		if (searchName.trim()) {
			records = records.filter((r) => r.wordName.toLowerCase().includes(searchName.trim().toLowerCase()));
		}
		if (statusFilter) {
			records = records.filter((r) => r.status === statusFilter);
		}
		return records;
	}, [data?.records, searchName, statusFilter]);

	const handleSearch = useCallback(() => {
		// filteredRecords is already reactive
	}, []);

	const handleReset = useCallback(() => {
		setSearchName("");
		setStatusFilter(undefined);
	}, []);

	const refetchAll = useCallback(async () => {
		await Promise.all([
			queryClient.refetchQueries({
				queryKey: ["banned-word-list", categoryId],
			}),
			queryClient.invalidateQueries({ queryKey: ["banned-word-overview"] }),
			queryClient.invalidateQueries({ queryKey: ["banned-word-categories"] }),
			queryClient.invalidateQueries({ queryKey: ["banned-word-distribution"] }),
		]);
	}, [queryClient, categoryId]);

	const handleToggleStatus = useCallback(
		async (record: BannedWordItem) => {
			try {
				await aiManagementService.toggleBannedWordStatus(record.id, record.status);
				message.success(`${record.status === "启用" ? "Disabled" : "Enabled"} successfully`);
				await refetchAll();
			} catch (error) {
				message.error(getApiErrorMessage(error, "Operation failed"));
			}
		},
		[message, refetchAll],
	);

	const handleDelete = useCallback(
		(record: BannedWordItem) => {
			modal.confirm({
				title: "Confirm Delete",
				content: `Delete banned word "${record.wordName}"? This cannot be undone.`,
				okText: "Delete",
				okType: "danger",
				cancelText: "Cancel",
				onOk: async () => {
					try {
						await aiManagementService.deleteBannedWord(record.id);
						message.success("Deleted successfully");
						await refetchAll();
					} catch (error) {
						message.error(getApiErrorMessage(error, "Failed to delete"));
					}
				},
			});
		},
		[message, modal, refetchAll],
	);

	const renderCheck = useCallback(
		(val: boolean) => (
			<span className={val ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>{val ? "✓" : ""}</span>
		),
		[],
	);

	const columns = useMemo<ColumnsType<BannedWordItem>>(
		() => [
			{
				title: "Word",
				dataIndex: "wordName",
				width: 110,
				align: "center",
			},
			{
				title: "Input Trigger",
				dataIndex: "inputTrigger",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "Output Trigger",
				dataIndex: "outputTrigger",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "Exact Match",
				dataIndex: "exactMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "Fuzzy Match",
				dataIndex: "fuzzyMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "Semantic",
				dataIndex: "semanticMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "Model",
				dataIndex: "modelMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{ title: "Added", dataIndex: "addTime", width: 155, align: "center" },
			{
				title: "Status",
				dataIndex: "status",
				width: 100,
				align: "center",
				render: (v: string) => BANNED_WORD_STATUS_LABELS[v] ?? v,
			},
			{
				title: "Actions",
				width: 120,
				align: "center",
				fixed: "right",
				render: (_: unknown, record: BannedWordItem) => (
					<Space>
						<Button
							type="link"
							className="p-0"
							danger={record.status === "启用"}
							onClick={() => handleToggleStatus(record)}
						>
							{record.status === "启用" ? "Disable" : "Enable"}
						</Button>
						<Button type="link" className="p-0" danger onClick={() => handleDelete(record)}>
							Delete
						</Button>
					</Space>
				),
			},
		],
		[renderCheck, handleToggleStatus, handleDelete],
	);

	return (
		<Modal
			title={`Banned Words - ${BANNED_WORD_CATEGORY_LABELS[categoryName] ?? categoryName}`}
			open={open}
			onCancel={onClose}
			footer={null}
			width={1000}
		>
			<div className="flex flex-wrap items-center gap-3 mb-4">
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">Word</span>
					<Input
						placeholder="Enter"
						className="w-28"
						size="middle"
						value={searchName}
						onChange={(e) => setSearchName(e.target.value)}
						allowClear
					/>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">Status</span>
					<Select
						placeholder="Select"
						className="w-24"
						options={[
							{ label: "Enabled", value: "启用" },
							{ label: "Disabled", value: "禁用" },
						]}
						value={statusFilter}
						onChange={setStatusFilter}
						allowClear
					/>
				</div>
				<Space className="ml-auto">
					<Button type="primary" size="middle" onClick={handleSearch}>
						Search
					</Button>
					<Button size="middle" onClick={handleReset}>
						Reset
					</Button>
				</Space>
			</div>

			<Table<BannedWordItem>
				columns={columns}
				dataSource={filteredRecords}
				loading={isLoading}
				rowKey="id"
				pagination={{
					pageSize: 10,
					total: filteredRecords.length,
					showTotal: (total) => `${total} records`,
				}}
				bordered
				size="small"
				scroll={{ x: "max-content" }}
			/>
		</Modal>
	);
};
