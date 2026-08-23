import { Button, message } from "antd";
import { useCallback, useMemo, useState } from "react";
import deptManagementService from "@/api/services/deptManagementService";
import { Icon } from "@/components/icon";
import type { TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { downloadExcelFile } from "@/utils";
import { getApiErrorMessage } from "@/utils/request-error";
import DeptMembersDialog from "./components/DeptMembersDialog";
import type { DepartmentManagementRecord } from "./types";
import { sysAccountManagementSearchResponsive } from "@/pages/sys-account-management/utils";

const SEARCH_CACHE_KEY = "department-management.search";

export default function DepartmentManagementPage() {
	const [membersOpen, setMembersOpen] = useState(false);
	const [currentDeptId, setCurrentDeptId] = useState<number | null>(null);
	const [currentDeptName, setCurrentDeptName] = useState<string | null>(null);
	const [exportLoading, setExportLoading] = useState(false);

	const handleMembersOpenChange = (open: boolean) => {
		setMembersOpen(open);
		if (!open) {
			setCurrentDeptId(null);
			setCurrentDeptName(null);
		}
	};

	const openDeptMembers = useCallback((record: DepartmentManagementRecord) => {
		setCurrentDeptId(record.deptId);
		setCurrentDeptName(record.deptName ?? record.deptIdName ?? null);
		setMembersOpen(true);
	}, []);

	const getSearchCache = useCallback(() => {
		const raw = sessionStorage.getItem(SEARCH_CACHE_KEY);
		if (!raw) return {};
		try {
			return JSON.parse(raw) as Record<string, unknown>;
		} catch {
			return {};
		}
	}, []);

	const handleExport = useCallback(async () => {
		if (exportLoading) return;
		setExportLoading(true);
		try {
			const params = getSearchCache();
			const { data, filename } = await deptManagementService.exportDeptList(
				params as Parameters<typeof deptManagementService.exportDeptList>[0],
			);
			const normalizedFilename = filename?.trim();
			const fileName = normalizedFilename || "部门列表.xlsx";
			downloadExcelFile(data, fileName);
			message.success("导出成功");
		} catch (error) {
			message.error(getApiErrorMessage(error, "导出失败"));
		} finally {
			setExportLoading(false);
		}
	}, [exportLoading, getSearchCache]);

	const tableConfig = useMemo<TableConfig<DepartmentManagementRecord>>(
		() => ({
			rowKey: "deptId",
			dataSource: {
				api: deptManagementService.getDeptPage,
				// defaultParams: { refreshKey },
			},
			toolbar: {
				align: "left",
				customActions: [
					{
						text: "导出部门数据",
						type: "default",
						loading: exportLoading,
						size: "middle",
						icon: <Icon icon="mingcute:download-line" />,
						iconPosition: "start",
						onClick: handleExport,
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
				cacheKey: SEARCH_CACHE_KEY,
				responsive: {
					...sysAccountManagementSearchResponsive,
				},
				fields: [
					{
						name: "deptName",
						label: "部门名称",
						type: "input",
						placeholder: "请输入",
					},
				],
			},
			columns: [
				{ title: "ID", dataIndex: "deptId", width: 180 },
				{
					title: "部门名称",
					dataIndex: "deptName",
					width: 160,

					ellipsis: true,
				},
				{
					title: "部门负责人",
					dataIndex: "deptLeader",
					width: 140,
					ellipsis: true,
				},
				{ title: "负责人电话", dataIndex: "leaderPhone", width: 140 },
				{
					title: "部门成员",
					dataIndex: "userCount",
					width: 120,
					render: (value: number, record: DepartmentManagementRecord) => (
						<Button type="link" className="p-0 text-primary underline" onClick={() => openDeptMembers(record)}>
							{value}
						</Button>
					),
				},
				{
					title: "更新时间",
					dataIndex: "updateTime",
					width: 180,
				},
			],
			pagination: {
				showQuickJumper: false,
				showSizeChanger: false,
				showTotal: (total) => `共 ${total} 条数据`,
			},
		}),
		[openDeptMembers, handleExport, exportLoading],
	);

	return (
		<>
			<ConfigTable config={tableConfig} />
			<DeptMembersDialog
				open={membersOpen}
				onOpenChange={handleMembersOpenChange}
				deptId={currentDeptId}
				deptName={currentDeptName}
			/>
		</>
	);
}
