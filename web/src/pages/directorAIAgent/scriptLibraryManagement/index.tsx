import { Button, Popconfirm } from "antd";
import dayjs from "dayjs";
import { useRef } from "react";
import { useMount } from "react-use";
import { deleteScript, getScriptList, getUserList } from "@/api/directorAIAgent";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Icon } from "@/components/icon";
import ConfigTable from "@/components/table";
import { useBrandSeriesModel, useConfigTable, useCopyToClipboard, useReactive } from "@/hooks";
import { PRESENTATION_FORM_OPTIONS } from "@/pages/directorAIAgent/scriptLibraryManagement/const.ts";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { ScriptInformation } from "./components";
import DetailModal from "./detailModal.tsx";

export default () => {
	const { options, $refs } = useReactive<State>({ options: [] });
	const { copyFn } = useCopyToClipboard();
	const { brandSeriesModelOpts, getBrandSeriesContent } = useBrandSeriesModel();
	const {
		configTableOpts,
		onEdit: onShow,
		onClose,
		onDelete,
		onRefresh,
		visible,
		record,
	} = useConfigTable({
		api: getScriptList,
		delApi({ id }) {
			return deleteScript(id);
		},
		fields: [
			{
				name: "keyword",
				label: "关键词搜索",
				type: "input",
				placeholder: "搜索脚本名称或内容",
			},
			brandSeriesModelOpts,
			{
				name: "creatorId",
				label: "创建人",
				type: "select",
				props: { showSearch: { optionFilterProp: "label" } },
				options,
			},
			{
				name: "presentationForm",
				label: "呈现形式",
				type: "select",
				options: PRESENTATION_FORM_OPTIONS,
			},
		],
		columns: [
			{
				title: "脚本信息",
				dataIndex: "title",
				width: 370,
				render(_, record) {
					return <ScriptInformation {...record} />;
				},
			},
			{
				title: "脚本内容",
				dataIndex: "scriptContent",
				width: 370,
				render(value) {
					return (
						<div className={"flex items-center gap-[12px] text-left"}>
							<div className={"line-clamp-4 whitespace-pre-wrap wrap-break-word flex-1 text-[#4E5969] text-[14px]"}>
								{value}
							</div>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Icon
									icon={"icon-park-outline:copy"}
									size={16}
									color={"#86909C"}
									onClick={() => copyFn(value)}
									className={"cursor-pointer "}
								/>
							</AuthGuard>
						</div>
					);
				},
			},
			{
				title: "品牌/车系",
				dataIndex: "brandSeriesModel",
				width: 250,
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
				title: "更新时间",
				dataIndex: "updateTime",
				width: 150,
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
				width: 250,
				render(_, record) {
					return (
						<div className={"flex items-center justify-center w-full"}>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button className="hidden!" type={"link"} onClick={() => onEdit(record)}>
									编辑
								</Button>
							</AuthGuard>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button type={"link"} onClick={() => onShow(record)}>
									查看详情
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
	const detailRef = useRef<DetailAction | null>(null);
	const onEdit = (record: Record<string, any>) => {
		onShow(record);
		setTimeout(() => detailRef.current?.edit());
	};
	useMount(async () => {
		const res = await getUserList();
		$refs.options = res.map(({ userId: value, name: label }) => ({
			label,
			value,
		}));
	});
	return (
		<>
			<ConfigTable {...configTableOpts} />
			<DetailModal
				visible={visible}
				data={record}
				onClose={onClose}
				onDelete={onDelete}
				onRefresh={onRefresh}
				getBrandSeriesContent={getBrandSeriesContent}
				ref={detailRef}
			/>
		</>
	);
};

interface DetailAction {
	edit: () => void;
}
interface State {
	options: { label: string; value: number }[];
}
