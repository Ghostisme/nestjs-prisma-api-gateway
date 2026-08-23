import { Modal, Table } from "antd";
import { useEffect, useState } from "react";
import { postBrandModelListApi } from "@/api/brand/model";

interface ModelListModalProps {
	open: boolean;
	onCancel: () => void;
	brandId?: number;
}

interface ModelRow {
	id: number;
	modelType: number; // 1-指定车型，2-全国，3-区域
	modelName: string;
}

export const ModelListModal = ({ open, onCancel, brandId }: ModelListModalProps) => {
	const [loading, setLoading] = useState(false);
	const [dataSource, setDataSource] = useState<ModelRow[]>([]);

	useEffect(() => {
		if (open && brandId) {
			setLoading(true);
			postBrandModelListApi({ brandId })
				.then((res: any) => {
					const data = res?.data || res;
					if (Array.isArray(data)) {
						setDataSource(data);
					} else {
						setDataSource([]);
					}
				})
				.catch((err) => {
					console.error(err);
					setDataSource([]);
				})
				.finally(() => {
					setLoading(false);
				});
		} else {
			setDataSource([]);
		}
	}, [open, brandId]);

	const columns = [
		{
			title: "车型ID",
			dataIndex: "id",
			key: "id",
		},
		{
			title: "车型类型",
			dataIndex: "modelType",
			key: "modelType",
			render: (type: number) => {
				const map = { 1: "指定车型", 2: "全国", 3: "区域" };
				return map[type as keyof typeof map] || "-";
			},
		},
		{
			title: "车型名称",
			dataIndex: "modelName",
			key: "modelName",
		},
	];

	return (
		<Modal title="查看车型数量" open={open} onCancel={onCancel} footer={null} width={600}>
			<Table loading={loading} dataSource={dataSource} columns={columns} pagination={false} rowKey="modelId" />
		</Modal>
	);
};
