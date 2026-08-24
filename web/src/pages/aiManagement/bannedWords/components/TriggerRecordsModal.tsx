import { Button, Input, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { useRouter } from "@/routes/hooks";
import { BANNED_WORD_CATEGORY_LABELS, type BannedWordTriggerRecord, INTERCEPT_STATUS_LABELS } from "../../types";

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
			{ title: "Name", dataIndex: "userName", width: 100, align: "center" },
			{
				title: "Word",
				dataIndex: "wordName",
				width: 120,
				align: "center",
			},
			{
				title: "Trigger Time",
				dataIndex: "triggerTime",
				width: 165,
				align: "center",
			},
			{
				title: "Intercept Status",
				dataIndex: "interceptStatus",
				width: 100,
				align: "center",
				render: (v: string) => INTERCEPT_STATUS_LABELS[v] ?? v,
			},
			{
				title: "Actions",
				width: 150,
				align: "center",
				render: (_: unknown, record: BannedWordTriggerRecord) => (
					<Button type="link" className="p-0" onClick={() => handleViewConversation(record)}>
						View Conversation
					</Button>
				),
			},
		],
		[handleViewConversation],
	);

	return (
		<Modal
			title={`Trigger Records - ${BANNED_WORD_CATEGORY_LABELS[categoryName] ?? categoryName}`}
			open={open}
			onCancel={onClose}
			footer={null}
			width={800}
		>
			<div className="flex flex-wrap items-center gap-3 mb-4">
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">Name</span>
					<Input
						placeholder="Enter"
						className="w-24"
						size="middle"
						value={searchName}
						onChange={(e) => setSearchName(e.target.value)}
						allowClear
					/>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">Word</span>
					<Input
						placeholder="Enter"
						className="w-24"
						size="middle"
						value={searchWord}
						onChange={(e) => setSearchWord(e.target.value)}
						allowClear
					/>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-sm shrink-0">Intercept Status</span>
					<Select
						placeholder="Select"
						className="w-24"
						options={[
							{ label: "Intercepted", value: "已拦截" },
							{ label: "Not Intercepted", value: "未拦截" },
						]}
						value={interceptFilter}
						onChange={setInterceptFilter}
						allowClear
					/>
				</div>
				<Space className="ml-auto">
					<Button type="primary" size="middle">
						Search
					</Button>
					<Button size="middle" onClick={handleReset}>
						Reset
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
					showTotal: (total) => `${total} records`,
				}}
				bordered
				size="small"
			/>
		</Modal>
	);
};
