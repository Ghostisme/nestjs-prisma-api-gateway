import { Modal, Button } from "antd";
import { useMemo } from "react";
import ConfigTable, { type TableConfig } from "@/components/table";
import { postBrandPmoListApi, postBrandSpecialistListApi } from "@/api/brand/library";

export interface ContactInfo {
	id: number;
	brandId?: number;
	name: string;
	phone: string;
	email: string;
	[key: string]: any;
}

interface SelectContactModalProps {
	open: boolean;
	onCancel: () => void;
	onSelect: (record: ContactInfo) => void;
	roleCode: string; // "PMO" | "SPECIALIST"
	title: string;
}

export const SelectContactModal = ({ open, onCancel, onSelect, roleCode, title }: SelectContactModalProps) => {
	const tableConfig = useMemo<TableConfig<ContactInfo>>(
		() => ({
			dataSource: {
				api: async (params) => {
					const { ...rest } = params;
					const api = roleCode === "PMO" ? postBrandPmoListApi : postBrandSpecialistListApi;
					const res: any = await api({
						roleCode,
						...rest,
					});
					// 假设接口返回的是数组
					const rawList = Array.isArray(res) ? res : res?.data || [];
					const list = rawList.map((item: any) => ({
						...item,
						id: item.id ?? item.userId, // 兼容 id 或 userId
					}));
					return {
						list: list,
						total: list.length,
						success: true,
					};
				},
			},
			search: {
				layout: "horizontal",
				colSpan: 12,
				grid: { columns: 2, md: 3, lg: 2, xl: 3, gap: 12 },
				fields: [
					{
						name: "name",
						label: "Name",
						type: "input",
						placeholder: "Enter name",
					},
					{
						name: "email",
						label: "Email",
						type: "input",
						placeholder: "Enter email",
					},
					{
						name: "phone",
						label: "Phone",
						type: "input",
						placeholder: "Enter phone",
					},
				],
			},
			columns: [
				{
					title: "Brand ID",
					dataIndex: "brandId",
					render: (val, record) => val || record.id || "-",
				},
				{
					title: "Name",
					dataIndex: "name",
				},
				{
					title: "Phone",
					dataIndex: "phone",
				},
				{
					title: "Email",
					dataIndex: "email",
				},
				{
					title: "Actions",
					dataIndex: "operation",
					render: (_, record) => (
						<Button
							type="link"
							onClick={() => {
								onSelect(record);
								onCancel();
							}}
						>
							Add
						</Button>
					),
				},
			],
			pagination: {
				pageSize: 10,
			},
		}),
		[roleCode, onSelect, onCancel],
	);

	return (
		<Modal title={title} open={open} onCancel={onCancel} footer={null} width={800} destroyOnHidden>
			<ConfigTable config={tableConfig} />
		</Modal>
	);
};
