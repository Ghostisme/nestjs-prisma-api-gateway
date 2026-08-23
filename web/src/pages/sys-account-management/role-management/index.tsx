import { App, Button, Popconfirm, Space } from "antd";
import { useCallback, useMemo, useState } from "react";
import roleManagementService from "@/api/services/roleManagementService";
import type { TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { getApiErrorMessage as getRequestApiErrorMessage } from "@/utils/request-error";
import RoleFormModal from "./components/RoleFormModal";
import type { RoleManagementRecord } from "./types";
import { sysAccountManagementSearchResponsive } from "@/pages/sys-account-management/utils";

const STATUS_LABEL: Record<number, string> = {
	0: "禁用",
	1: "启用",
};

function getApiErrorMessage(error: unknown, fallback: string): string {
	return getRequestApiErrorMessage(error, fallback);
}

export default function RoleManagementPage() {
	const { message } = App.useApp();
	const [refreshKey, setRefreshKey] = useState(0);
	const [formOpen, setFormOpen] = useState(false);
	const [formRoleId, setFormRoleId] = useState<number | null>(null);
	const [formMode, setFormMode] = useState<"create" | "edit">("create");

	const openCreateRole = useCallback(() => {
		setFormMode("create");
		setFormRoleId(null);
		setFormOpen(true);
	}, []);

	const openEdit = useCallback((record: RoleManagementRecord) => {
		setFormMode("edit");
		setFormRoleId(record.roleId);
		setFormOpen(true);
	}, []);

	const handleFormSuccess = useCallback(() => {
		setFormOpen(false);
		setRefreshKey((k) => k + 1);
	}, []);

	const handleDisable = useCallback(
		async (roleId: number) => {
			try {
				await roleManagementService.disableRole(roleId);
				message.success("禁用成功");
				setRefreshKey((k) => k + 1);
			} catch (error) {
				message.error(getApiErrorMessage(error, "禁用失败"));
			}
		},
		[message],
	);

	const handleEnable = useCallback(
		async (roleId: number) => {
			try {
				await roleManagementService.enableRole(roleId);
				message.success("启用成功");
				setRefreshKey((k) => k + 1);
			} catch (error) {
				message.error(getApiErrorMessage(error, "启用失败"));
			}
		},
		[message],
	);

	const columns = useMemo<TableConfig<RoleManagementRecord>["columns"]>(
		() => [
			{ title: "角色ID", dataIndex: "roleId", width: 180 },
			{
				title: "角色名",
				dataIndex: "roleName",
				width: 180,

				ellipsis: true,
			},
			{
				title: "角色描述",
				dataIndex: "roleDesc",
				width: 200,
				ellipsis: true,
				tooltip: true,
			},
			{
				title: "角色状态",
				dataIndex: "status",
				width: 120,
				render: (value: number) => STATUS_LABEL[value] ?? "-",
			},
			{ title: "创建时间", dataIndex: "createTime", width: 180 },
			{
				title: "操作",
				dataIndex: "actions",
				width: 180,
				render: (_: unknown, record: RoleManagementRecord) => (
					<Space>
						<Button type="link" className="p-0" onClick={() => openEdit(record)}>
							编辑
						</Button>
						{record.status === 1 && (
							<Popconfirm title="是否确认禁用该角色？" onConfirm={() => handleDisable(record.roleId)}>
								<Button type="link" className="p-0" danger>
									禁用
								</Button>
							</Popconfirm>
						)}
						{record.status === 0 && (
							<Popconfirm title="是否确认启用该角色？" onConfirm={() => handleEnable(record.roleId)}>
								<Button type="link" className="p-0">
									启用
								</Button>
							</Popconfirm>
						)}
					</Space>
				),
			},
		],
		[openEdit, handleDisable, handleEnable],
	);

	const tableConfig: TableConfig<RoleManagementRecord> = {
		rowKey: "roleId",
		dataSource: {
			api: roleManagementService.getRolePage,
			defaultParams: { refreshKey },
		},
		toolbar: {
			align: "left",
			customActions: [
				{
					text: "新建角色",
					type: "primary",
					onClick: () => openCreateRole(),
				},
			],
		},
		scroll: { x: "max-content", y: 520 },
		sticky: true,
		zebra: true,
		bordered: true,
		paginationMode: "auto",
		search: {
			layout: "horizontal",
			showAdvanced: false,
			isButtonHorizontal: true,
			colSpan: 6,
			gap: 12,
			cacheKey: "role-management.search",
			responsive: {
				...sysAccountManagementSearchResponsive,
			},
			fields: [
				{
					name: "roleName",
					label: "角色名",
					type: "input",
					placeholder: "请输入",
				},
				{
					name: "status",
					label: "角色状态",
					type: "select",
					placeholder: "请选择",
					options: [
						{ label: "启用", value: 1 },
						{ label: "禁用", value: 0 },
					],
				},
			],
		},
		columns,
		pagination: {
			showQuickJumper: false,
			showSizeChanger: false,
			showTotal: (total) => `共 ${total} 条数据`,
		},
	};

	return (
		<>
			<ConfigTable config={tableConfig} />
			<RoleFormModal
				open={formOpen}
				onOpenChange={setFormOpen}
				mode={formMode}
				roleId={formRoleId}
				onSuccess={handleFormSuccess}
			/>
		</>
	);
}
