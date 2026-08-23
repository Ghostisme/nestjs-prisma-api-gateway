import { Button, Input, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { useRouter } from "@/routes/hooks";
import type { BannedWordTriggerRecord } from "../../types";

interface TriggerRecordsModalProps {
	open: boolean;
	onClose: () => void;
	categoryId: number | null;
	categoryName: string;
}

export const TriggerRecordsModal = ({
	open,
	onClose,
	categoryId,
	categoryName,
}: TriggerRecordsModalProps): JSX.Element => {
	const router = useRouter();
	const [searchName, setSearchName] = useState("");
	const [searchWord, setSearchWord] = useState("");
	const [interceptFilter, setInterceptFilter] = useState<string | undefined>(undefined);

	const { data, isLoading } = useQuery({
		queryKey: ["trigger-records", categoryId],
		queryFn: () => aiManagementService.getTriggerRecords(categoryId ?? undefined),
		enabled: open && categoryId !== null,
	});

	const filteredRecords = useMemo(() => {
		let records = data?.records ?? [];
		if (searchName.trim()) {
			records = records.filter((r) => r.userName.toLowerCase().includes(searchName.trim().toLowerCase()));
		}
		if (searchWord.trim()) {
			records = records.filter((r) => r.wordName.toLowerCase().includes(searchWord.trim().toLowerCase()));
		}
		if (interceptFilter) {
			records = records.filter((r) => r.interceptStatus === interceptFilter);
		}
		return records;
	}, [data?.records, searchName, searchWord, interceptFilter]);

	const handleReset = useCallback(() => {
		setSearchName("");
		setSearchWord("");
		setInterceptFilter(undefined);
	}, []);

	const handleViewConversation = useCallback(
		(record: BannedWordTriggerRecord) => {
			onClose();
			router.push(`/ai-management/conversation-view?dialogId=${record.id}`);
		},
		[router, onClose],
	);

	const columns = useMemo<ColumnsType<BannedWordTriggerRecord>>(
		() => [
			{ title: "姓名", dataIndex: "userName", width: 100, align: "center" },
			{
				title: "违禁词名称",
				dataIndex: "wordName",
				width: 120,
				align: "center",
			},
			{
				title: "触发时间",
				dataIndex: "triggerTime",
				width: 165,
				align: "center",
			},
			{
				title: "拦截状态",
				dataIndex: "interceptStatus",
				width: 100,
				align: "center",
			},
			{
				title: "操作",
				width: 150,
				align: "center",
				render: (_: unknown, record: BannedWordTriggerRecord) => (
					<Button type="link" className="p-0" onClick={() => handleViewConversation(record)}>
						查看对话详情
					</Button>
				),
			},
		],
		[handleViewConversation],
	);

	return (
		<Modal title={`触发记录 - ${categoryName}`} open={open} onCancel={onClose} footer={null} width={800}>
			<div className="flex flex-wrap items-center gap-3 mb-4">
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">姓名</span>
					<Input
						placeholder="请输入"
						className="w-24"
						size="middle"
						value={searchName}
						onChange={(e) => setSearchName(e.target.value)}
						allowClear
					/>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">违禁词名称</span>
					<Input
						placeholder="请输入"
						className="w-24"
						size="middle"
						value={searchWord}
						onChange={(e) => setSearchWord(e.target.value)}
						allowClear
					/>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">拦截状态</span>
					<Select
						placeholder="请选择"
						className="w-24"
						options={[
							{ label: "已拦截", value: "已拦截" },
							{ label: "未拦截", value: "未拦截" },
						]}
						value={interceptFilter}
						onChange={setInterceptFilter}
						allowClear
					/>
				</div>
				<Space className="ml-auto">
					<Button type="primary" size="middle">
						查询
					</Button>
					<Button size="middle" onClick={handleReset}>
						重置
					</Button>
				</Space>
			</div>

			<Table<BannedWordTriggerRecord>
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
			/>
		</Modal>
	);
};
