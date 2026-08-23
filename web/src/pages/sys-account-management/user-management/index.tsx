import { useQuery } from "@tanstack/react-query";
import { App, Button, Popconfirm, Space } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import userManagementService, { type DeptInfoNode } from "@/api/services/userManagementService";
import type { TableAction, TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import type { TreeSelectOption } from "@/components/table/types";
import { getApiErrorMessage } from "@/utils/request-error";
import UserDetailsDialog from "./components/UserDetailsDialog";
import UserFormDialog from "./components/UserFormDialog";
import type { UserManagementRecord } from "./types";
import { sysAccountManagementSearchResponsive } from "@/pages/sys-account-management/utils";

const STATUS_LABEL: Record<number, string> = {
	0: "启用",
	1: "禁用",
};

// 统一表格空值占位，避免单元格展示为空白。
const EMPTY_CELL_PLACEHOLDER = "-";

// 文本字段为空或仅包含空白字符时，统一展示占位符。
const formatTextCell = (value: string | null | undefined) => value?.trim() || EMPTY_CELL_PLACEHOLDER;

// 列表字段过滤空项后拼接，全部为空时展示占位符。
const formatListCell = (values: Array<string | null | undefined>) => {
	const text = values
		.map((value) => value?.trim())
		.filter(Boolean)
		.join("、");
	return text || EMPTY_CELL_PLACEHOLDER;
};

export default function UserManagementPage() {
	const { message } = App.useApp();
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [detailsUserId, setDetailsUserId] = useState<number | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [formUserId, setFormUserId] = useState<number | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const tableActionRef = useRef<TableAction | null>(null);

	const openDetails = useCallback((userId: number) => {
		setDetailsUserId(userId);
		setDetailsOpen(true);
	}, []);

	const openForm = useCallback((userId: number | null) => {
		setFormUserId(userId);
		setFormOpen(true);
	}, []);

	const handleFormSuccess = useCallback(() => {
		setFormOpen(false);
		tableActionRef.current?.reload({ resetPage: true });
	}, []);

	const handleDisable = useCallback(
		async (userId: number) => {
			try {
				await userManagementService.disableUser(userId);
				message.success("禁用成功");
				setRefreshKey((k) => k + 1);
			} catch (error) {
				message.error(getApiErrorMessage(error, "禁用失败"));
			}
		},
		[message],
	);

	const handleEnable = useCallback(
		async (userId: number) => {
			try {
				await userManagementService.enableUser(userId);
				message.success("启用成功");
				setRefreshKey((k) => k + 1);
			} catch (error) {
				message.error(getApiErrorMessage(error, "启用失败"));
			}
		},
		[message],
	);

	const handleResetPassword = useCallback(
		async (userId: number) => {
			try {
				await userManagementService.resetPassword(userId);
				message.success("重置密码成功");
			} catch (error) {
				message.error(getApiErrorMessage(error, "重置密码失败"));
			}
		},
		[message],
	);

	const { data: deptTreeList = [] } = useQuery({
		queryKey: ["dept-info"],
		queryFn: () => userManagementService.getDeptInfo(),
	});
	const deptTreeData = useMemo<TreeSelectOption[]>(() => {
		const mapNodes = (nodes: DeptInfoNode[]): TreeSelectOption[] =>
			nodes.map((node) => ({
				title: node.deptName,
				value: node.deptId,
				key: node.deptId,
				children: node.children ? mapNodes(node.children) : undefined,
			}));
		return mapNodes(deptTreeList);
	}, [deptTreeList]);

	const defaultParams = useMemo(() => ({ refreshKey }), [refreshKey]);
	const getUserPageWithBackendPagination = useCallback((params?: Record<string, unknown>) => {
		const { page, pageSize, ...rest } = params ?? {};
		return userManagementService.getUserPage({
			...rest,
			current: page,
			size: pageSize,
		});
	}, []);
	const dataSource = useMemo(
		() => ({
			api: getUserPageWithBackendPagination,
			defaultParams,
		}),
		[defaultParams, getUserPageWithBackendPagination],
	);

	const columns = useMemo<TableConfig<UserManagementRecord>["columns"]>(
		() => [
			{ title: "ID", dataIndex: "userId", width: 180 },
			{
				title: "姓名",
				dataIndex: "name",
				width: 180,
				ellipsis: true,
				render: (value: string) => formatTextCell(value),
			},
			{
				title: "用户名",
				dataIndex: "username",
				width: 180,
				tooltip: true,
				render: (value: string) => formatTextCell(value),
			},
			{
				title: "所属部门",
				// dataIndex: "deptName",
				dataIndex: "deptList",
				tooltip: true,
				ellipsis: true,
				width: 180,
				render: (_: unknown, record: UserManagementRecord) => (
					<span>{formatListCell(record.deptList.map((item) => item.deptName))}</span>
				),
			},
			{
				title: "所属角色",
				// dataIndex: "roleName",
				dataIndex: "roleList",
				tooltip: true,
				width: 180,
				render: (_: unknown, record: UserManagementRecord) => (
					<span>{formatListCell(record.roleList.map((item) => item.roleName))}</span>
				),
			},
			// 暂时不需要部门
			// {
			//   title: "所属部门",
			//   // dataIndex: "postName",
			//   dataIndex: "postList",
			//   tooltip: true,
			//   width: 180,
			//
			//   render: (_: unknown, record: UserManagementRecord) => (
			//     <span>{record.postList.map((item) => item.postName).join("、")}</span>
			//   ),
			// },
			{
				title: "联系电话",
				dataIndex: "phone",
				width: 180,
				tooltip: true,
				render: (value: string) => formatTextCell(value),
			},
			{
				title: "联系邮箱",
				dataIndex: "email",
				width: 250,
				ellipsis: true,
				render: (value: string) => formatTextCell(value),
			},
			{
				title: "用户状态",
				dataIndex: "status",
				width: 120,
				render: (value: number) => STATUS_LABEL[value] ?? EMPTY_CELL_PLACEHOLDER,
			},
			{
				title: "创建时间",
				dataIndex: "createTime",
				width: 210,
				render: (value: string) => formatTextCell(value),
			},
			{
				title: "操作",
				dataIndex: "actions",
				width: 320,
				fixed: "right",
				render: (_: unknown, record: UserManagementRecord) => (
					<Space>
						<Button type="link" className="p-0" onClick={() => openDetails(record.userId)}>
							查看
						</Button>
						<Button type="link" className="p-0" onClick={() => openForm(record.userId)}>
							编辑
						</Button>
						{record.status === 0 && (
							<Popconfirm title="是否确认禁用该用户？" onConfirm={() => handleDisable(record.userId)}>
								<Button type="link" className="p-0" danger>
									禁用
								</Button>
							</Popconfirm>
						)}
						{record.status === 1 && (
							<Popconfirm title="是否确认启用该用户？" onConfirm={() => handleEnable(record.userId)}>
								<Button type="link" className="p-0">
									启用
								</Button>
							</Popconfirm>
						)}
						<Popconfirm title="是否确认重置密码？" onConfirm={() => handleResetPassword(record.userId)}>
							<Button type="link" className="p-0">
								重置密码
							</Button>
						</Popconfirm>
					</Space>
				),
			},
		],
		[openDetails, openForm, handleDisable, handleEnable, handleResetPassword],
	);

	const tableConfig = useMemo<TableConfig<UserManagementRecord>>(
		() => ({
			rowKey: "userId",
			dataSource,
			toolbar: {
				align: "left",
				customActions: [
					{
						text: "新建用户",
						type: "primary",
						onClick: () => openForm(null),
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
				colSpan: 6,
				gap: 12,
				cacheKey: "user-management.search",
				responsive: {
					...sysAccountManagementSearchResponsive,
				},
				fields: [
					{
						name: "username",
						label: "用户名",
						type: "input",
						placeholder: "请输入",
					},
					{ name: "name", label: "姓名", type: "input", placeholder: "请输入" },
					// {
					// 	name: "deptIds",
					// 	label: "所属部门",
					// 	type: "multiTreeSelect",
					// 	placeholder: "请选择",
					// 	treeData: deptTreeData,
					// },
					// {
					// 	name: "roleIds",
					// 	label: "所属角色",
					// 	type: "selectMultiQuery",
					// 	placeholder: "请选择",
					// 	options: roleOptions,
					// },
					{
						name: "email",
						label: "联系邮箱",
						type: "input",
						placeholder: "请输入",
					},
					{
						name: "phone",
						label: "联系电话",
						type: "input",
						placeholder: "请输入",
					},
					{
						name: "status",
						label: "用户状态",
						type: "select",
						options: [
							{ label: "启用", value: 0 },
							{ label: "禁用", value: 1 },
						],
					},
				],
			},
			pagination: {
				showQuickJumper: false,
				showSizeChanger: false,
				showTotal: (total) => `共 ${total} 条数据`,
			},
			columns,
		}),
		[dataSource, columns, openForm],
	);

	return (
		<>
			<ConfigTable config={tableConfig} actionRef={tableActionRef} />
			<UserDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} userId={detailsUserId} />
			<UserFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				userId={formUserId}
				deptTreeData={deptTreeData}
				onSuccess={handleFormSuccess}
			/>
		</>
	);
}
