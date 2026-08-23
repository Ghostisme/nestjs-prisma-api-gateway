import { App, Button, Input, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { getApiErrorMessage } from "@/utils/request-error";
import type { BannedWordItem } from "../../types";

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
				message.success(`${record.status === "启用" ? "禁用" : "启用"}成功`);
				await refetchAll();
			} catch (error) {
				message.error(getApiErrorMessage(error, "操作失败"));
			}
		},
		[message, refetchAll],
	);

	const handleDelete = useCallback(
		(record: BannedWordItem) => {
			modal.confirm({
				title: "确认删除",
				content: `确定要删除违禁词「${record.wordName}」吗？删除后不可恢复。`,
				okText: "删除",
				okType: "danger",
				cancelText: "取消",
				onOk: async () => {
					try {
						await aiManagementService.deleteBannedWord(record.id);
						message.success("删除成功");
						await refetchAll();
					} catch (error) {
						message.error(getApiErrorMessage(error, "删除失败"));
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
				title: "违禁词名称",
				dataIndex: "wordName",
				width: 110,
				align: "center",
			},
			{
				title: "输入触发",
				dataIndex: "inputTrigger",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "输出触发",
				dataIndex: "outputTrigger",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "精确匹配",
				dataIndex: "exactMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "模糊匹配",
				dataIndex: "fuzzyMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "语义理解",
				dataIndex: "semanticMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{
				title: "模型识别",
				dataIndex: "modelMatch",
				width: 80,
				align: "center",
				render: renderCheck,
			},
			{ title: "添加时间", dataIndex: "addTime", width: 155, align: "center" },
			{ title: "违禁词状态", dataIndex: "status", width: 100, align: "center" },
			{
				title: "操作",
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
							{record.status === "启用" ? "禁用" : "启用"}
						</Button>
						<Button type="link" className="p-0" danger onClick={() => handleDelete(record)}>
							删除
						</Button>
					</Space>
				),
			},
		],
		[renderCheck, handleToggleStatus, handleDelete],
	);

	return (
		<Modal title={`违禁词列表 - ${categoryName}`} open={open} onCancel={onClose} footer={null} width={1000}>
			<div className="flex flex-wrap items-center gap-3 mb-4">
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">违禁词名称</span>
					<Input
						placeholder="请输入"
						className="w-28"
						size="middle"
						value={searchName}
						onChange={(e) => setSearchName(e.target.value)}
						allowClear
					/>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">违禁词状态</span>
					<Select
						placeholder="请选择"
						className="w-24"
						options={[
							{ label: "启用", value: "启用" },
							{ label: "禁用", value: "禁用" },
						]}
						value={statusFilter}
						onChange={setStatusFilter}
						allowClear
					/>
				</div>
				<Space className="ml-auto">
					<Button type="primary" size="middle" onClick={handleSearch}>
						查询
					</Button>
					<Button size="middle" onClick={handleReset}>
						重置
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
					showTotal: (total) => `共 ${total} 条数据`,
				}}
				bordered
				size="small"
				scroll={{ x: "max-content" }}
			/>
		</Modal>
	);
};
