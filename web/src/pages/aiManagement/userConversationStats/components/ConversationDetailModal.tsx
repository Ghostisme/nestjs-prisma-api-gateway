import { Button, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { useRouter } from "@/routes/hooks";
import type { ConversationDetailRecord } from "../../types";

interface ConversationDetailModalProps {
	open: boolean;
	onClose: () => void;
	userId: number | null;
	userName: string;
}

export const ConversationDetailModal = ({
	open,
	onClose,
	userId,
	userName,
}: ConversationDetailModalProps): JSX.Element => {
	const router = useRouter();

	const handleViewDetail = useCallback(
		(dialogId: string) => {
			onClose();
			router.push(`/ai-management/conversation-view?dialogId=${dialogId}`);
		},
		[router, onClose],
	);

	const { data, isLoading } = useQuery({
		queryKey: ["conversation-details", userId],
		queryFn: () => aiManagementService.getConversationDetails(userId as number),
		enabled: open && userId !== null,
	});

	const columns = useMemo<ColumnsType<ConversationDetailRecord>>(
		() => [
			{ title: "Conversation ID", dataIndex: "dialogId", width: 160, align: "center" },
			{ title: "Model", dataIndex: "model", width: 100, align: "center" },
			{ title: "Agent", dataIndex: "agent", width: 120, align: "center" },
			{
				title: "Title",
				dataIndex: "dialogTitle",
				width: 130,
				align: "center",
			},
			{
				title: "Start Time",
				dataIndex: "startTime",
				width: 155,
				align: "center",
			},
			{ title: "End Time", dataIndex: "endTime", width: 155, align: "center" },
			{ title: "Duration", dataIndex: "duration", width: 100, align: "center" },
			{
				title: "Tokens",
				dataIndex: "consumeToken",
				width: 100,
				align: "center",
				render: (v: number) => v.toLocaleString(),
			},
			{
				title: "Satisfaction",
				dataIndex: "userSatisfaction",
				width: 100,
				align: "center",
			},
			{
				title: "Banned Word Triggers",
				dataIndex: "bannedWordTriggerCount",
				width: 120,
				align: "center",
			},
			{
				title: "Actions",
				width: 120,
				align: "center",
				fixed: "right",
				render: (_: unknown, record: ConversationDetailRecord) => (
					<Button type="link" className="p-0" onClick={() => handleViewDetail(record.dialogId)}>
						View Details
					</Button>
				),
			},
		],
		[handleViewDetail],
	);

	return (
		<Modal title={`Conversation Details - ${userName}`} open={open} onCancel={onClose} footer={null} width={1200}>
			<Table<ConversationDetailRecord>
				columns={columns}
				dataSource={data?.records}
				loading={isLoading}
				rowKey="dialogId"
				pagination={{
					pageSize: 10,
					total: data?.total,
					showTotal: (total) => `${total} records`,
				}}
				bordered
				size="small"
				scroll={{ x: "max-content" }}
			/>
		</Modal>
	);
};
