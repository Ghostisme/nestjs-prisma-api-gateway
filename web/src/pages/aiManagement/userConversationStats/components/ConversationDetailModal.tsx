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
			{ title: "对话ID", dataIndex: "dialogId", width: 160, align: "center" },
			{ title: "Model", dataIndex: "model", width: 100, align: "center" },
			{ title: "Agent", dataIndex: "agent", width: 120, align: "center" },
			{
				title: "对话标题",
				dataIndex: "dialogTitle",
				width: 130,
				align: "center",
			},
			{
				title: "开始时间",
				dataIndex: "startTime",
				width: 155,
				align: "center",
			},
			{ title: "结束时间", dataIndex: "endTime", width: 155, align: "center" },
			{ title: "对话时长", dataIndex: "duration", width: 100, align: "center" },
			{
				title: "消耗token",
				dataIndex: "consumeToken",
				width: 100,
				align: "center",
				render: (v: number) => v.toLocaleString(),
			},
			{
				title: "用户满意度",
				dataIndex: "userSatisfaction",
				width: 100,
				align: "center",
			},
			{
				title: "触发违禁词次数",
				dataIndex: "bannedWordTriggerCount",
				width: 120,
				align: "center",
			},
			{
				title: "操作",
				width: 120,
				align: "center",
				fixed: "right",
				render: (_: unknown, record: ConversationDetailRecord) => (
					<Button type="link" className="p-0" onClick={() => handleViewDetail(record.dialogId)}>
						查看对话详情
					</Button>
				),
			},
		],
		[handleViewDetail],
	);

	return (
		<Modal title={`查看对话明细 - ${userName}`} open={open} onCancel={onClose} footer={null} width={1200}>
			<Table<ConversationDetailRecord>
				columns={columns}
				dataSource={data?.records}
				loading={isLoading}
				rowKey="dialogId"
				pagination={{
					pageSize: 10,
					total: data?.total,
					showTotal: (total) => `共 ${total} 条数据`,
				}}
				bordered
				size="small"
				scroll={{ x: "max-content" }}
			/>
		</Modal>
	);
};
