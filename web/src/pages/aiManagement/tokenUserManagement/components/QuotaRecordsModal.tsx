import { Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import type { QuotaOperationRecord } from "../../types";

interface QuotaRecordsModalProps {
	open: boolean;
	onClose: () => void;
	userId: number | null;
}

export const QuotaRecordsModal = ({ open, onClose, userId }: QuotaRecordsModalProps): JSX.Element => {
	const { data, isLoading } = useQuery({
		queryKey: ["quota-records", userId],
		queryFn: () => aiManagementService.getQuotaRecords(userId as number),
		enabled: open && userId !== null,
	});

	const columns = useMemo<ColumnsType<QuotaOperationRecord>>(
		() => [
			{ title: "配额原始配额", dataIndex: "originalQuota", align: "center" },
			{ title: "配额操作", dataIndex: "operation", align: "center" },
			{ title: "配额实际配额", dataIndex: "actualQuota", align: "center" },
			{ title: "操作人类", dataIndex: "operatorName", align: "center" },
			{ title: "操作时间", dataIndex: "operateTime", align: "center" },
		],
		[],
	);

	return (
		<Modal title="操作记录" open={open} onCancel={onClose} footer={null} width={700}>
			<Table<QuotaOperationRecord>
				columns={columns}
				dataSource={data}
				loading={isLoading}
				rowKey={(_, index) => String(index)}
				pagination={false}
				bordered
				size="small"
			/>
		</Modal>
	);
};
