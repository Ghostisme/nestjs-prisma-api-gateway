import { Button, Popconfirm } from "antd";
import dayjs from "dayjs";
import { deleteSellingPoint, getSellingPointList } from "@/api/directorAIAgent";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthCheck } from "@/components/auth/use-auth";
import { Icon } from "@/components/icon";
import ConfigTable from "@/components/table";
import { useBrandSeriesModel, useConfigTable } from "@/hooks";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { TagList } from "./components";
import EditModal from "./editModal.tsx";

export default () => {
	const { check } = useAuthCheck("permission");
	const { brandSeriesModelOpts, getBrandSeriesContent } = useBrandSeriesModel(undefined, {
		disableModel: true,
		placeholder: "请选择品牌/车系",
	});
	const { configTableOpts, onAdd, onEdit, onClose, onDelete, onRefresh, visible, record } = useConfigTable({
		api: getSellingPointList,
		delApi({ id }) {
			return deleteSellingPoint(id);
		},
		fields: [brandSeriesModelOpts],
		customActions: [
			...(check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
				? [
						{
							text: "添加卖点",
							type: "primary" as const,
							onClick: () => onAdd(),
							icon: <Icon icon={"gridicons:add-outline"} size={16} color={"#FFF"} />,
						},
					]
				: []),
		],
		columns: [
			{
				title: "品牌/车系",
				dataIndex: "brandSeriesModel",
				tooltip(_, record) {
					return getBrandSeriesContent(record);
				},
				render(_, record) {
					return (
						<div className={"overflow-hidden whitespace-nowrap text-ellipsis text-[#4E5969] text-[14px]"}>
							{getBrandSeriesContent(record)}
						</div>
					);
				},
			},
			{
				title: "车系卖点",
				dataIndex: "tags",
				width: 600,
				render(value) {
					return <TagList data={value} />;
				},
			},
			{
				title: "创建时间",
				dataIndex: "createTime",
				render(value) {
					return (
						<div className={"text-[#4E5969] text-[14px]"}>
							{value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-"}
						</div>
					);
				},
			},
			{
				title: "更新时间",
				dataIndex: "updateTime",
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
				dataIndex: "operation",
				fixed: "right",
				render(_, record) {
					return (
						<div className={"flex items-center justify-center w-full"}>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button type={"link"} onClick={() => onEdit(record)}>
									编辑
								</Button>
							</AuthGuard>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
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
		</>
	);
};
