import { useQuery } from "@tanstack/react-query";
import { Button, Modal, message, Space, Tabs } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";
import materialService from "@/api/material/materialService";
import type { MaterialAuditListParams, MaterialAuditRow } from "@/api/material/types";
import { useAuthCheck } from "@/components/auth/use-auth";
import { Icon } from "@/components/icon";
import { TableTags } from "@/components/TableTags";
import type { TableAction, TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { VideoInfo } from "@/components/VideoInfo";
import {
	getRequestErrorMessage,
	MATERIAL_PAGE_SIZE,
	MATERIAL_REFERENCE_QUERY_OPTIONS,
} from "@/pages/materialCenter/shared";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { useRequestFileHost } from "@/store/appStore";

type AuditMode = "material" | "correction";

interface RejectState {
	open: boolean;
	reason: string;
	rows: MaterialAuditRow[];
	fromBatch: boolean;
	onSuccess?: () => void;
}

type AuditColumns = NonNullable<TableConfig<MaterialAuditRow>["columns"]>;
type AuditSearchConfig = NonNullable<TableConfig<MaterialAuditRow>["search"]>;
type UploaderOption = { label: string; value: string | number };

function formatDateTime(value?: string): string {
	if (!value) return "-";
	return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
}

function getReviewedTags(row: MaterialAuditRow) {
	const currentTags = row.currentTags ?? [];
	const auditingTags = row.auditingInfo?.auditingTags ?? [];
	return auditingTags.length > 0 ? auditingTags : currentTags;
}

function createAuditColumns(params: {
	mode: AuditMode;
	fileHost: string;
	onRejectRow: (row: MaterialAuditRow) => void;
	onApproveRow: (row: MaterialAuditRow) => void;
	isSubmitting: boolean;
	canReject: boolean;
	canApprove: boolean;
}): AuditColumns {
	const { mode, fileHost, onRejectRow, onApproveRow, isSubmitting, canReject, canApprove } = params;
	const baseColumns: AuditColumns = [
		{
			title: "",
			dataIndex: "selection",
			key: "selection",
			width: 48,
			selection: true,
			render: () => null,
		},
		{
			title: "视频",
			dataIndex: "video",
			key: "video",
			width: 320,
			align: "left",
			render: (_: unknown, record: MaterialAuditRow) => (
				<VideoInfo
					row={record}
					fileHost={fileHost}
					isShowReason={false}
					coverExtra={
						<>
							{record.quality === 2 && (
								<span
									className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
									style={{ background: "#165DFF" }}
								>
									<Icon icon="noto:red-heart" className="size-3" />
									优质
								</span>
							)}
							{record.quality === 1 && (
								<span
									className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
									style={{ background: "#F53F3F" }}
								>
									<Icon icon="noto:warning" className="size-3" />
									劣质
								</span>
							)}
							{record.status === "marking_review_in_progress" && (
								<span
									className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
									style={{
										color: "#FF7D00",
										backgroundColor: "rgba(255, 125, 0, 0.2)",
									}}
								>
									审核中
								</span>
							)}
							{record.status === "revision_pending_review" && (
								<span
									className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
									style={{
										color: "#FF7D00",
										backgroundColor: "rgba(255, 125, 0, 0.2)",
									}}
								>
									标签修正审核中
								</span>
							)}
						</>
					}
				/>
			),
		},
		// 不要展示单独列了，因为卡片视图已经展示
		// {
		// 	title: "品牌/车系/车型",
		// 	dataIndex: "carModelInfo",
		// 	key: "carModelInfo",
		// 	width: 180,
		// 	render: (_: unknown, record: MaterialAuditRow) => <span>{renderCarModelLines(record.carModelInfo)}</span>,
		// },
		{
			title: "AI标签",
			dataIndex: "aiTags",
			key: "aiTags",
			width: 160,
			render: (_: unknown, record: MaterialAuditRow) => <TableTags tags={record.aiTags} />,
		},
		{
			title: "人工标签",
			dataIndex: "nTags",
			key: "nTags",
			width: 160,
			render: (_: unknown, record: MaterialAuditRow) => <TableTags tags={record.nTags} />,
		},
	];

	const actionColumn: AuditColumns[number] = {
		title: "操作",
		dataIndex: "actions",
		key: "actions",
		width: 180,
		fixed: "right",
		render: (_: unknown, record: MaterialAuditRow) => (
			<Space className="flex w-full justify-start">
				{canReject && (
					<Button
						type="link"
						size="small"
						style={{ padding: 0 }}
						disabled={isSubmitting}
						onClick={() => onRejectRow(record)}
					>
						不通过
					</Button>
				)}
				{canApprove && (
					<Button
						type="link"
						size="small"
						style={{ padding: 0 }}
						disabled={isSubmitting}
						onClick={() => onApproveRow(record)}
					>
						通过审核
					</Button>
				)}
			</Space>
		),
	};

	if (mode === "material") {
		return [
			...baseColumns,
			{
				title: "上传时间",
				dataIndex: "createdTime",
				key: "createdTime",
				width: 180,
				render: (value: unknown) => formatDateTime(value as string | undefined),
			},
			{
				title: "上传人",
				dataIndex: "createdUserName",
				key: "createdUserName",
				width: 140,
				render: (value: unknown) => (value ? String(value) : "-"),
			},
			actionColumn,
		];
	}

	return [
		...baseColumns,
		{
			title: "编辑人/时间",
			dataIndex: "updatedTime",
			key: "updatedTime",
			width: 170,
			render: (_: unknown, record: MaterialAuditRow) => (
				<div className="text-xs leading-5">
					<div className="text-[14px] text-[#000000]">{record.updateUserName ?? "-"}</div>
					<div className="text-[12px] text-[#86909C] mt-1">{formatDateTime(record.updatedTime)}</div>
				</div>
			),
		},
		{
			title: "上传人/时间",
			dataIndex: "createdTime",
			key: "createdTime",
			width: 170,
			render: (_: unknown, record: MaterialAuditRow) => (
				<div className="text-xs leading-5">
					<div className="text-[14px] text-[#000000]">{record.createdUserName ?? "-"}</div>
					<div className="text-[12px] text-[#86909C] mt-1">{formatDateTime(record.createdTime)}</div>
				</div>
			),
		},
		{
			title: "拍摄人/时间",
			dataIndex: "photographer",
			key: "photographer",
			width: 170,
			render: (_: unknown, record: MaterialAuditRow) => {
				const nextPhotographer = record.auditingInfo?.photographer ?? record.photographer;
				const highlighted = nextPhotographer !== record.photographer;
				const shootDate = record.auditingInfo?.shootDate
					? dayjs(record.auditingInfo.shootDate).format("YYYY-MM-DD")
					: "-";
				return (
					<div className="text-xs leading-5">
						<div className={highlighted ? "text-[14px] text-[#ff7070]" : "text-[14px] text-[#000000]"}>
							{nextPhotographer || "-"}
						</div>
						<div className="text-[12px] text-[#86909C] mt-1">{shootDate}</div>
					</div>
				);
			},
		},
		actionColumn,
	];
}

function createAuditSearchConfig(mode: AuditMode, uploaderOptions: UploaderOption[]): AuditSearchConfig {
	const fields: NonNullable<AuditSearchConfig["fields"]> = [
		{
			name: "brandModelSeries",
			label: "品牌/车系/车型",
			type: "brandTreeSelect",
			placeholder: "请选择",
		},
		{
			name: "createdBy",
			label: "上传人",
			type: "select",
			placeholder: "请选择上传人",
			options: uploaderOptions,
			defaultValue: 0,
			props: {
				showSearch: true,
				allowClear: true,
			},
		},
	];

	if (mode === "correction") {
		fields.push({
			name: "photographer",
			label: "拍摄人",
			type: "input",
			placeholder: "请输入拍摄人",
		});
	}

	return {
		layout: "horizontal",
		showAdvanced: false,
		initialVisibleCount: 4,
		searchButtonText: "搜索",
		resetButtonText: "重置",
		grid: { columns: 4, md: 3, lg: 4, xl: 4, gap: 12 },
		fields,
	};
}

const REJECT_STATE_INITIAL: RejectState = {
	open: false,
	reason: "",
	rows: [],
	fromBatch: false,
	onSuccess: undefined,
};

function AuditListPanel({ mode }: { mode: AuditMode }) {
	const actionRef = useRef<TableAction | null>(null);
	const fileHost = useRequestFileHost();
	const authCheck = useAuthCheck("permission");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canReject = authCheck.check(
		mode === "material" ? LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage : LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage,
	);
	const canApprove = authCheck.check(
		mode === "material" ? LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage : LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage,
	);
	const canBatchReject = authCheck.check(
		mode === "material" ? LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage : LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage,
	);
	const canBatchApprove = authCheck.check(
		mode === "material" ? LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage : LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage,
	);
	const [rejectState, setRejectState] = useState<RejectState>(REJECT_STATE_INITIAL);

	// Refs for reading current values inside stable callbacks without triggering re-memoization
	const isSubmittingRef = useRef(false);
	const rejectStateRef = useRef(rejectState);
	rejectStateRef.current = rejectState;

	const setSubmitting = useCallback((value: boolean) => {
		isSubmittingRef.current = value;
		setIsSubmitting(value);
	}, []);

	const { data: systemUsers } = useQuery({
		queryKey: ["material-audit-system-users"],
		queryFn: () => materialService.getSystemUserList(),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});

	// Keep options in stable shape even when request fails.
	const uploaderOptions = useMemo(() => {
		const users = systemUsers ?? [];
		return [{ label: "全部", value: 0 }, ...users.map((item) => ({ label: item.name, value: item.userId }))];
	}, [systemUsers]);

	const fetchList = useCallback(
		async (params: Record<string, unknown>) => {
			const {
				page = 1,
				pageSize = MATERIAL_PAGE_SIZE,
				...rest
			} = params as {
				page?: number;
				pageSize?: number;
				createdBy?: string | number;
				photographer?: string;
				brandModelSeries?: string;
			};

			const apiParams: MaterialAuditListParams = {
				...rest,
				createdBy: rest.createdBy ? rest.createdBy : undefined,
				page,
				pageSize,
				type: 1,
			};

			const response =
				mode === "material"
					? await materialService.getMaterialAuditList(apiParams)
					: await materialService.getMaterialCorrectionList(apiParams);
			const list = (response.list ?? []).map((item) => ({
				...item,
				nTags: getReviewedTags(item),
			}));
			return { list, total: response.total ?? 0 };
		},
		[mode],
	);

	const submitAudit = useCallback(
		async (rows: MaterialAuditRow[], result: boolean, reason: string, fromBatch = false) => {
			if (fromBatch) {
				const batchApi =
					mode === "material" ? materialService.batchAuditMaterial : materialService.batchAuditMaterialCorrection;
				const response = await batchApi({
					ids: rows.map((row) => row.id),
					result,
					reason,
				});
				const batchResult = response as { code?: number; msg?: string; message?: string } | undefined;
				if (batchResult?.code === 1) {
					throw new Error(batchResult.message || batchResult.msg || "批量审核失败");
				}
			} else {
				const api = mode === "material" ? materialService.auditMaterial : materialService.auditMaterialCorrection;
				const settleResult = await Promise.allSettled(rows.map((row) => api({ id: row.id, result, reason })));
				const failedResults = settleResult.filter((item) => item.status === "rejected");
				if (failedResults.length > 0) {
					const successCount = rows.length - failedResults.length;
					const firstError = failedResults[0];
					const firstMessage =
						firstError.status === "rejected" ? getRequestErrorMessage(firstError.reason, "审核失败") : "审核失败";
					if (successCount > 0) {
						throw new Error(`部分操作成功（成功${successCount}条，失败${failedResults.length}条）：${firstMessage}`);
					}
					throw new Error(firstMessage);
				}
			}
			actionRef.current?.reload({ resetPage: true });
		},
		[mode],
	);

	// isSubmittingRef used as guard to avoid closure over stale isSubmitting state,
	// keeping handleApproveRows reference stable across submit cycles.
	const handleApproveRows = useCallback(
		(rows: MaterialAuditRow[], fromBatch = false, onSuccess?: () => void) => {
			Modal.confirm({
				title: rows.length > 1 ? "确认通过选中的审核项吗？" : "确认通过审核吗？",
				okText: "确定",
				cancelText: "取消",
				onOk: async () => {
					if (isSubmittingRef.current) return;
					setSubmitting(true);
					try {
						await submitAudit(rows, true, "", fromBatch);
						message.success("通过审核成功");
						onSuccess?.();
					} catch (error) {
						message.error(getRequestErrorMessage(error, rows.length > 1 ? "批量审核失败" : "审核失败"));
						throw error;
					} finally {
						setSubmitting(false);
					}
				},
			});
		},
		[setSubmitting, submitAudit],
	);

	const openRejectModal = useCallback((rows: MaterialAuditRow[], fromBatch = false, onSuccess?: () => void) => {
		setRejectState({
			open: true,
			reason: "",
			rows,
			fromBatch,
			onSuccess,
		});
	}, []);

	// rejectStateRef always holds the latest state, so this callback never needs to list
	// individual rejectState fields as deps — avoids recreation on every textarea keystroke.
	const handleRejectConfirm = useCallback(async () => {
		if (isSubmittingRef.current) return;
		const { rows, reason, fromBatch, onSuccess } = rejectStateRef.current;
		if (!reason.trim()) {
			message.warning("请输入不通过原因");
			return;
		}
		setSubmitting(true);
		try {
			await submitAudit(rows, false, reason.trim(), fromBatch);
			message.success(rows.length > 1 ? "拒绝审核成功" : "审核未通过");
			onSuccess?.();
			setRejectState(REJECT_STATE_INITIAL);
		} catch (error) {
			message.error(getRequestErrorMessage(error, rows.length > 1 ? "批量审核失败" : "审核失败"));
		} finally {
			setSubmitting(false);
		}
	}, [setSubmitting, submitAudit]);

	const columns = useMemo(
		() =>
			createAuditColumns({
				mode,
				fileHost,
				onRejectRow: (row) => openRejectModal([row]),
				onApproveRow: (row) => handleApproveRows([row]),
				isSubmitting,
				canReject,
				canApprove,
			}),
		[fileHost, handleApproveRows, isSubmitting, mode, openRejectModal, canReject, canApprove],
	);

	const searchFields = useMemo(() => createAuditSearchConfig(mode, uploaderOptions), [mode, uploaderOptions]);

	const tableConfig = useMemo<TableConfig<MaterialAuditRow>>(
		() => ({
			rowKey: "id",
			dataSource: {
				api: fetchList,
			},
			scroll: { x: "max-content", y: 520 },
			sticky: true,
			paginationMode: "auto",
			rowSelection: true,
			search: searchFields,
			batchActions: (
				[
					canBatchReject
						? {
								text: "不通过审核",
								action: "batch-reject",
								requireSelection: true,
								disabled: isSubmitting,
								onClick: (rows: MaterialAuditRow[], onSuccess?: () => void) => openRejectModal(rows, true, onSuccess),
							}
						: null,
					canBatchApprove
						? {
								text: "通过审核",
								action: "batch-approve",
								requireSelection: true,
								disabled: isSubmitting,
								onClick: (rows: MaterialAuditRow[], onSuccess?: () => void) => handleApproveRows(rows, true, onSuccess),
							}
						: null,
				] as const
			).filter((x): x is NonNullable<typeof x> => x !== null),
			pagination: {
				pageSize: MATERIAL_PAGE_SIZE,
				pageSizeOptions: [10, 20, 50],
				showSizeChanger: true,
				showQuickJumper: false,
				showTotal: (total) => `共${total}条`,
			},
			columns,
		}),
		[
			columns,
			fetchList,
			handleApproveRows,
			isSubmitting,
			openRejectModal,
			searchFields,
			canBatchReject,
			canBatchApprove,
		],
	);

	return (
		<>
			<ConfigTable config={tableConfig} actionRef={actionRef} />
			<Modal
				title="不通过原因"
				open={rejectState.open}
				okText="确定"
				cancelText="取消"
				confirmLoading={isSubmitting}
				onOk={handleRejectConfirm}
				onCancel={() => {
					if (isSubmitting) return;
					setRejectState(REJECT_STATE_INITIAL);
				}}
			>
				<textarea
					className="mt-4 h-28 w-full rounded-md border border-[#d9d9d9] px-3 py-2 outline-none focus:border-(--ant-color-primary)"
					placeholder="请输入不通过原因"
					value={rejectState.reason}
					disabled={isSubmitting}
					onChange={(event) => setRejectState((prev) => ({ ...prev, reason: event.target.value }))}
				/>
			</Modal>
		</>
	);
}

function AuditPage() {
	return (
		<div className="space-y-4">
			<Tabs
				destroyOnHidden
				items={[
					{
						key: "material",
						label: "素材审核",
						children: <AuditListPanel mode="material" />,
					},
					{
						key: "correction",
						label: "素材修正",
						children: <AuditListPanel mode="correction" />,
					},
				]}
			/>
		</div>
	);
}

export default AuditPage;
