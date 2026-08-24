import { Modal } from "antd";
import { useMemo } from "react";
import { postBrandLogsApi } from "@/api/brand/library";
import ConfigTable, { type TableConfig } from "@/components/table";
import type { BrandLog } from "../types";

interface OperationLogModalProps {
	open: boolean;
	onCancel: () => void;
	brandId?: string;
}

export const OperationLogModal = ({ open, onCancel, brandId }: OperationLogModalProps) => {
	const tableConfig = useMemo<TableConfig<BrandLog>>(
		() => ({
			dataSource: {
				api: async (params) => {
					if (!brandId) return { list: [], total: 0 };
					const { page, pageSize, ...rest } = params;
					return postBrandLogsApi({
						brandId: +brandId,
						current: page as number,
						size: pageSize as number,
						...rest,
					});
				},
			},
			scroll: { x: "max-content", y: 320 },
			// paginationMode: "client",
			search: {
				layout: "horizontal",
				isButtonHorizontal: true,
				colSpan: 12,
				grid: { columns: 2, md: 3, lg: 2, xl: 3, gap: 12 },
				fields: [
					{
						name: "createByName",
						label: "Operator",
						type: "input",
						placeholder: "Enter operator",
					},
					{
						name: "createTime",
						label: "Time",
						type: "daterange",
						submitAs: { start: "startTime", end: "endTime" },
						props: { format: "YYYY-MM-DD HH:mm:ss", showTime: true },
					},
				],
			},
			columns: [
				{
					title: "Operator",
					dataIndex: "createByName",
				},
				{
					title: "Time",
					dataIndex: "createTime",
				},
				{
					title: "Action",
					dataIndex: "operationContent",
				},
			],
			pagination: {
				showQuickJumper: false,
				showSizeChanger: false,
				pageSize: 10,
				showTotal: (total) => `${total} records`,
			},
		}),
		[brandId],
	);

	return (
		<Modal title="操作记录" open={open} onCancel={onCancel} footer={null} width={800} destroyOnHidden>
			<ConfigTable config={tableConfig} />
		</Modal>
	);
};
