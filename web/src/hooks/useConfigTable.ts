import { useRef } from "react";
import { toast } from "sonner";
import type { TableAction, TableConfig } from "@/components/table";
import type { SearchFieldConfig, TableColumn, ToolbarAction } from "@/components/table/types.ts";
import { useReactive } from "@/hooks/index.ts";
import { materialCenterSearchResponsive as responsive } from "@/pages/materialCenter/utils";
import type { UserManagementRecord } from "@/pages/sys-account-management/user-management/types.ts";

export default ({ api, fields, customActions, columns, delApi }: Props) => {
	const { visible, record, $refs, $reset } = useReactive<State>({
		visible: false,
		record: {},
	});
	const actionRef = useRef<TableAction | null>(null);
	const onAdd = () => {
		$refs.visible = true;
	};
	const onEdit = (record: Record<string, any>) => {
		$refs.record = record;
		onAdd();
	};
	const onClose = () => $reset();
	const onDelete = async (record: Record<string, any>) => {
		await delApi?.(record);
		toast.success("删除成功");
		onRefresh();
	};
	const onRefresh = () => actionRef.current?.reload();
	return {
		configTableOpts: {
			config: {
				...(tableConfig as any),
				dataSource: { api },
				search: { ...tableConfig.search, fields },
				toolbar: { ...tableConfig.toolbar, customActions },
				columns,
			},
			actionRef,
		},
		visible,
		record,
		onAdd,
		onEdit,
		onClose,
		onDelete,
		onRefresh,
	};
};
const tableConfig: TableConfig<UserManagementRecord> = {
	rowKey: "id",
	scroll: { x: "max-content", y: 510 },
	sticky: true,
	// zebra: true,
	bordered: true,
	paginationMode: "auto",
	search: {
		layout: "horizontal",
		showAdvanced: false,
		colSpan: 6,
		gap: 12,
		responsive,
	},
	toolbar: { align: "left" },
	pagination: {
		showQuickJumper: false,
		showSizeChanger: false,
		showTotal: (total) => `共 ${total} 条数据`,
	},
};

interface Props {
	api(params: Record<string, any>): Promise<any>;
	delApi?(params: Record<string, any>): Promise<any>;
	fields?: SearchFieldConfig[];
	customActions?: ToolbarAction<any>[];
	columns: TableColumn<any>[];
}
interface State {
	visible: boolean;
	record: Record<string, any>;
}
