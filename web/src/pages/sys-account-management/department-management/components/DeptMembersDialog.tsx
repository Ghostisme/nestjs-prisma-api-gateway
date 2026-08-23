import { useQuery } from "@tanstack/react-query";
import { Modal, message } from "antd";
import { useMemo, useRef, useState } from "react";
import type { DeptUserRecord, DeptUsersPageParams } from "@/api/services/deptManagementService";
import deptManagementService from "@/api/services/deptManagementService";
import roleManagementService from "@/api/services/roleManagementService";
import { Icon } from "@/components/icon";
import type { TableAction, TableConfig } from "@/components/table";
import { getApiErrorMessage } from "@/utils/request-error";

import ConfigTable from "@/components/table";

type DeptMembersDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	deptId: number | null;
	deptName?: string | null;
};

export default function DeptMembersDialog({ open, onOpenChange, deptId, deptName }: DeptMembersDialogProps) {
	const actionRef = useRef<TableAction | null>(null);
	const [exportLoading, setExportLoading] = useState(false);
	const { data: roleList = [] } = useQuery({
		queryKey: ["role-simple-all"],
		queryFn: () => roleManagementService.getRoleSimpleAll(),
	});
	const roleOptions = useMemo(() => roleList.map((role) => ({ label: role.roleName, value: role.roleId })), [roleList]);
	const dataSource: TableConfig<DeptUserRecord>["dataSource"] =
		deptId !== null
			? {
					api: (params: Record<string, unknown>) =>
						deptManagementService.getDeptUsersPage(params as DeptUsersPageParams),
					defaultParams: { deptId },
				}
			: { data: [] };

	const handleExport = async () => {
		if (!deptId || exportLoading) return;
		setExportLoading(true);
		try {
			const searchValues = actionRef.current?.getSearchValues() ?? {};
			const { data, filename } = await deptManagementService.exportDeptUsers({
				deptId,
				...searchValues,
			});
			const normalizedFilename = filename?.trim();
			const fileName = normalizedFilename || `${deptName ?? "部门"}-成员列表.xlsx`;
			const excelMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
			const fileBlob =
				data instanceof Blob
					? data.type
						? data
						: new Blob([data], { type: excelMime })
					: new Blob([data], { type: excelMime });
			const blobUrl = URL.createObjectURL(fileBlob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = fileName;
			link.click();
			URL.revokeObjectURL(blobUrl);
			message.success("导出成功");
		} catch (error) {
			message.error(getApiErrorMessage(error, "导出失败"));
		} finally {
			setExportLoading(false);
		}
	};

	const tableConfig: TableConfig<DeptUserRecord> = {
		rowKey: "userId",
		dataSource,
		scroll: { x: "max-content", y: 360 },
		sticky: true,
		zebra: true,
		bordered: true,
		paginationMode: "auto",
		search: {
			layout: "horizontal",
			showAdvanced: false,
			colSpan: 6,
			gap: 12,
			grid: { columns: 2, md: 3, lg: 4, xl: 5, gap: 12 },
			fields: [
				{ name: "name", label: "姓名", type: "input", placeholder: "请输入" },
				{
					name: "roleIds",
					label: "所属角色",
					type: "selectMultiQuery",
					placeholder: "请选择",
					options: roleOptions,
				},
				{
					name: "phone",
					label: "联系电话",
					type: "input",
					placeholder: "请输入",
				},
				{
					name: "email",
					label: "联系邮箱",
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
						{ label: "未在系统中创建账号", value: 10 },
					],
				},
			],
		},
		columns: [
			{ title: "ID", dataIndex: "userId", width: 180 },
			{ title: "姓名", dataIndex: "name", width: 140, ellipsis: true },
			{ title: "角色", dataIndex: "roleName", width: 140, ellipsis: true },
			{ title: "联系电话", dataIndex: "phone", width: 140 },
			{
				title: "联系邮箱",
				dataIndex: "email",
				width: 220,
				ellipsis: true,
				tooltip: true,
			},
			{
				title: "用户状态",
				dataIndex: "statusName",
				width: 120,
			},
			{ title: "创建时间", dataIndex: "createTime", width: 180 },
		],
		toolbar: {
			align: "left",
			customActions: [
				{
					text: "导出部门成员列表",
					type: "primary",
					loading: exportLoading,
					size: "middle",
					icon: <Icon icon="mingcute:download-line" />,
					iconPosition: "start",
					disabled: !deptId,
					onClick: handleExport,
				},
			],
		},
	};

	return (
		<Modal
			open={open}
			title={deptName ? `部门成员 - ${deptName}` : "部门成员"}
			width={"70vw"}
			footer={null}
			onCancel={() => onOpenChange(false)}
		>
			<ConfigTable config={tableConfig} actionRef={actionRef} />
		</Modal>
	);
}
