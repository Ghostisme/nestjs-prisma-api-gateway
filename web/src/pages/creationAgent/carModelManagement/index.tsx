import { Button, Popconfirm, Switch, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { deleteCarModel, getCarModelList, batchStatusCarModel } from "@/api/creationAgent";
import CarModelSvg from "@/assets/svg/car-model.svg";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Icon } from "@/components/icon";
import ConfigTable from "@/components/table";
import { useBrandSeriesModel, useConfigTable } from "@/hooks";
import { TagList } from "./components";
import EditModal from "./editModal.tsx";
import ImportModal from "./importModal.tsx";

export default () => {
	const [importVisible, setImportVisible] = useState(false);
	const { brandSeriesModelOpts, getBrandSeriesContent } = useBrandSeriesModel(undefined, {
		disableModel: true,
		placeholder: "请选择品牌/车系",
	});

	const { configTableOpts, onAdd, onEdit, onClose, onDelete, onRefresh, visible, record } = useConfigTable({
		api: async (params) => {
			// 将使用到的参数适配到新的接口上
			const listParams = {
				page: params.current || 1,
				pageSize: params.pageSize || 10,
				keyword: params.name, // 假设之前的name对应现在的keyword
				brandId: params.brandId,
				modelName: params.modelName,
			};
			const res = await getCarModelList(listParams);
			return {
				...res,
				total: res?.total || 0,
				list: (res?.list || []).map((item: any, index: number) => ({
					...item,
					brand: item.brandName || "Mock品牌",
					model: item.modelName || `Mock车型${index + 1}`,
					cover: item.coverImageUrl || CarModelSvg,
					sellingPoints: item.sellingPoints?.length ? item.sellingPoints : [],
					policies: item.promotionPolicies?.length ? item.promotionPolicies : [],
					status: item.status === "normal" ? true : item.status === "true" || item.status === true,
				})),
			};
		},
		delApi({ id }) {
			return deleteCarModel(id);
		},
		fields: [
			brandSeriesModelOpts,
			{
				name: "modelName", // 修改为 modelName 以匹配新接口
				label: "车型名称",
				type: "input",
				props: {
					placeholder: "请输入车型名称",
				},
			},
		],
		customActions: [
			{
				text: "批量导入",
				render: () => (
					<Button
						type="primary"
						style={{ backgroundColor: "#52c41a" }}
						onClick={() => setImportVisible(true)}
						icon={<Icon icon={"mdi:import"} size={16} color={"#FFF"} />}
					>
						批量导入
					</Button>
				),
			},
			{
				text: "添加",
				type: "primary" as const,
				onClick: () => onAdd(),
				icon: <Icon icon={"gridicons:add-outline"} size={16} color={"#FFF"} />,
			},
		],
		columns: [
			{
				title: "序号",
				dataIndex: "index",
				width: 60,
				render: (_, __, index) => index + 1,
			},
			{
				title: "车型品牌",
				dataIndex: "brandName",
				width: 120,
			},
			{
				title: "车型",
				dataIndex: "modelName",
				width: 120,
			},
			// {
			// 	title: "PNG封面",
			// 	dataIndex: "cover",
			// 	width: 100,
			// 	align: "center",
			// 	render: (value) => (value ? <img src={value} alt="cover" className="w-[115px] h-auto object-cover" /> : "-"),
			// },
			{
				title: "车型卖点",
				dataIndex: "sellingPoints",
				width: 300,
				render(value) {
					return <TagList data={value} />;
				},
			},
			{
				title: "优惠政策",
				dataIndex: "policies",
				width: 300,
				render(value) {
					return <TagList data={value} />;
				},
			},
			{
				title: "状态",
				dataIndex: "status",
				width: 80,
				render: (value, record) => (
					<Switch
						checked={value}
						onChange={async (checked) => {
							try {
								await batchStatusCarModel({ ids: [record.id], status: checked });
								message.success("状态更新成功");
								onRefresh();
							} catch (_e) {
								message.error("状态更新失败");
							}
						}}
					/>
				),
			},
			{
				title: "更新时间",
				dataIndex: "updateTime",
				width: 160,
				render(value) {
					return (
						<div className={"text-[#4E5969] text-[14px]"}>
							{value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-"}
						</div>
					);
				},
			},
			{
				title: "操作",
				width: 120,
				dataIndex: "operation",
				fixed: "right",
				render(_, record) {
					return (
						<div className={"flex items-center justify-center w-full"}>
							<AuthGuard>
								<Button type={"link"} onClick={() => onEdit(record)}>
									编辑
								</Button>
							</AuthGuard>
							<AuthGuard>
								<Popconfirm title="是否确认删除？" onConfirm={() => onDelete(record)}>
									<Button type={"link"} danger>
										删除
									</Button>
								</Popconfirm>
							</AuthGuard>
						</div>
					);
				},
			},
		],
	});

	return (
		<>
			<ConfigTable {...configTableOpts} />
			<EditModal
				visible={visible}
				data={record}
				onClose={onClose}
				onRefresh={onRefresh}
				getBrandSeriesContent={getBrandSeriesContent}
			/>
			<ImportModal visible={importVisible} onClose={() => setImportVisible(false)} onRefresh={onRefresh} />
		</>
	);
};
