import { Button, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { useRouter } from "@/routes/hooks";
import type { TokenConsumptionDetail } from "../../types";

interface ConsumptionDetailModalProps {
	open: boolean;
	onClose: () => void;
	userId: number | null;
	userName: string;
}

export const ConsumptionDetailModal = ({
	open,
	onClose,
	userId,
	userName,
}: ConsumptionDetailModalProps): JSX.Element => {
	const router = useRouter();

	const { data, isLoading } = useQuery({
		queryKey: ["consumption-details", userId],
		queryFn: () => aiManagementService.getConsumptionDetails(userId as number),
		enabled: open && userId !== null,
	});

	const handleExport = useCallback(() => {
		const records = data?.records;
		if (!records?.length) return;

		const headers = ["使用模型", "使用Agent", "Input Token", "Out Token", "消耗Token", "剩余Token", "消耗时间"];
		const csvRows = [
			headers.join(","),
			...records.map((r) =>
				[r.modelType, r.agentName, r.inputToken, r.outToken, r.consumeToken, r.remainToken, r.consumeTime].join(","),
			),
		];
		const bom = "\uFEFF";
		const blob = new Blob([bom + csvRows.join("\n")], {
			type: "text/csv;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `消耗明细_${userName}_${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [data?.records, userName]);

	const handleViewConversation = useCallback(
		(record: TokenConsumptionDetail) => {
			onClose();
			router.push(`/ai-management/conversation-view?dialogId=${record.id}`);
		},
		[router, onClose],
	);

	const columns = useMemo<ColumnsType<TokenConsumptionDetail>>(
		() => [
			{ title: "使用模型", dataIndex: "modelType", align: "center" },
			{ title: "使用Agent", dataIndex: "agentName", align: "center" },
			{
				title: "Input Token",
				dataIndex: "inputToken",
				align: "center",
				render: (v: number) => v.toLocaleString(),
			},
			{
				title: "Out Token",
				dataIndex: "outToken",
				align: "center",
				render: (v: number) => v.toLocaleString(),
			},
			{
				title: "消耗Token",
				dataIndex: "consumeToken",
				align: "center",
				render: (v: number) => v.toLocaleString(),
			},
			{
				title: "剩余Token",
				dataIndex: "remainToken",
				align: "center",
				render: (v: number) => v.toLocaleString(),
			},
			{ title: "消耗时间", dataIndex: "consumeTime", align: "center" },
			{
				title: "操作",
				align: "center",
				render: (_: unknown, record: TokenConsumptionDetail) => (
					<Button type="link" className="p-0" onClick={() => handleViewConversation(record)}>
						查看详情
					</Button>
				),
			},
		],
		[handleViewConversation],
	);

	return (
		<Modal title={`查看消耗明细 - ${userName}`} open={open} onCancel={onClose} footer={null} width={1000}>
			<div className="flex justify-end mb-3">
				<Button type="primary" size="small" onClick={handleExport} disabled={!data?.records?.length}>
					导出消耗数据
				</Button>
			</div>
			<Table<TokenConsumptionDetail>
				columns={columns}
				dataSource={data?.records}
				loading={isLoading}
				rowKey="id"
				pagination={{
					pageSize: 10,
					total: data?.total,
					showTotal: (total) => `共 ${total} 条数据`,
				}}
				bordered
				size="small"
			/>
		</Modal>
	);
};
