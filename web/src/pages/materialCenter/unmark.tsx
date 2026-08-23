import { useQuery } from "@tanstack/react-query";
import type { MenuProps } from "antd";
import { App, Button, Dropdown, Modal, Popover, Space } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import materialService from "@/api/material/materialService";
import type { MaterialRow } from "@/api/material/types";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthCheck } from "@/components/auth/use-auth";
import { Icon } from "@/components/icon";
import { TableTags } from "@/components/TableTags";
import type { TableAction, TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { VideoInfo } from "@/components/VideoInfo";
import { MaterialCardView } from "@/pages/materialCenter/components/cardTable";
import { type MaterialEditMode, MaterialTagEditModal } from "@/pages/materialCenter/components/MaterialTagEditModal";
import { MaterialUploadDialog } from "@/pages/materialCenter/components/MaterialUploadDialog";
import {
	assignNormalizedBrandModelSeries,
	buildMaterialListBaseParams,
	downloadMaterial,
	downloadMaterialsInBatch,
	ensureApiSuccess,
	formatMaterialDate,
	getRequestErrorMessage,
	MATERIAL_PAGE_SIZE,
	MATERIAL_REFERENCE_QUERY_OPTIONS,
	MATERIAL_SORT_OPTIONS,
	type MaterialOrderBy,
	type MaterialViewMode,
	sanitizeQueryParams,
	toNumberArray,
	transformMaterialListResponse,
	useMaterialBatchDialog,
} from "@/pages/materialCenter/shared";
import { materialCenterSearchResponsive } from "@/pages/materialCenter/utils";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { useRequestFileHost } from "@/store/appStore";

const AI_TAG_STATUS_PENDING = "pending";
const AI_TAG_STATUS_FAILED = "failed";
const TAG_SOURCE_AI = "AI";
const UNMARK_AUTO_REFRESH_INTERVAL_MS = 10_000;

const STATUS_OPTIONS = [
	{ label: "未申请审核", value: "pending_tagging" },
	{ label: "审核中", value: "marking_review_in_progress" },
	{ label: "未通过", value: "re_review_rejected" },
] as const;

function canShowSupplementAction(record: MaterialRow): boolean {
	return record.status === "pending_tagging" && record.aiTagStatus !== AI_TAG_STATUS_PENDING;
}

function getUnmarkedStatusConfig(record: MaterialRow): {
	text: string;
	color: string;
	popoverTitle?: string;
	popoverContent?: string;
} {
	if (
		record.status === "pending_tagging" &&
		record.tagSource === TAG_SOURCE_AI &&
		record.aiTagStatus === AI_TAG_STATUS_FAILED
	) {
		return { text: "AI打标失败", color: "#999999" };
	}

	const base = {
		pending_tagging: { label: "未申请审核", color: "#999999" },
		marking_review_in_progress: { label: "审核中", color: "#FF9900" },
		re_review_rejected: { label: "未通过", color: "#F53F3F" },
	}[record.status ?? ""];

	if (!base) return { text: "-", color: "#999999" };

	const tagSourceText = record.tagSource === "manual" ? "人工" : record.tagSource === TAG_SOURCE_AI ? "AI" : "";
	const needTagSource =
		record.status === "marking_review_in_progress" ||
		record.status === "re_review_rejected" ||
		record.status === "approved";
	const text = needTagSource && tagSourceText ? `${base.label} · ${tagSourceText}` : base.label;

	const isRejected = record.status === "re_review_rejected";
	const popoverContent = isRejected && record.tagSource === TAG_SOURCE_AI ? record.aiTagRejectReason : record.reason;
	const popoverTitle = tagSourceText ? `原因（${tagSourceText}）` : "原因";

	return {
		text,
		color: base.color,
		popoverTitle: isRejected ? popoverTitle : undefined,
		popoverContent: isRejected ? popoverContent : undefined,
	};
}

function UnmarkPage() {
	const { message } = App.useApp();
	const authCheck = useAuthCheck("permission");
	const tableActionRef = useRef<TableAction | null>(null);
	const autoRefreshInFlightRef = useRef(false);
	const shouldAutoRefreshRef = useRef(false);
	const requestFileHost = useRequestFileHost();

	const [orderBy, setOrderBy] = useState<MaterialOrderBy>("time");
	const [premiumOnly, setPremiumOnly] = useState(false);
	const [viewMode, setViewMode] = useState<MaterialViewMode>("list");
	const [rowMutating, setRowMutating] = useState(false);
	const [materialModalOpen, setMaterialModalOpen] = useState(false);
	const [materialModalMode, setMaterialModalMode] = useState<MaterialEditMode>("edit");
	const [materialModalRow, setMaterialModalRow] = useState<MaterialRow | null>(null);
	const [materialModalRows, setMaterialModalRows] = useState<MaterialRow[]>([]);
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const batchDeleteDialog = useMaterialBatchDialog<MaterialRow>();
	const batchDownloadDialog = useMaterialBatchDialog<MaterialRow>();

	const { data: photographers = [] } = useQuery({
		queryKey: ["material-photographers"],
		queryFn: () => materialService.getPhotographers(),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});

	const { data: materialTypes = [], refetch: refetchMaterialTypes } = useQuery({
		queryKey: ["search-material-type-list-all"],
		queryFn: () => materialService.getMaterialTypeListAll(),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});

	useEffect(() => {
		refetchMaterialTypes();
	}, [refetchMaterialTypes]);

	const photographerOptions = useMemo(
		() => photographers.map((name) => ({ label: name, value: name })),
		[photographers],
	);

	const materialTypeSearchOptions = useMemo(
		() => materialTypes.map((item) => ({ label: item.typeName, value: item.id })),
		[materialTypes],
	);

	useEffect(() => {
		const timer = window.setInterval(() => {
			if (
				document.hidden ||
				autoRefreshInFlightRef.current ||
				!shouldAutoRefreshRef.current ||
				rowMutating ||
				materialModalOpen ||
				uploadDialogOpen ||
				batchDeleteDialog.open ||
				batchDownloadDialog.open
			) {
				return;
			}
			autoRefreshInFlightRef.current = true;
			void Promise.all([Promise.resolve(tableActionRef.current?.reload()), refetchMaterialTypes()]).finally(() => {
				autoRefreshInFlightRef.current = false;
			});
		}, UNMARK_AUTO_REFRESH_INTERVAL_MS);

		return () => {
			window.clearInterval(timer);
		};
	}, [
		rowMutating,
		materialModalOpen,
		uploadDialogOpen,
		batchDeleteDialog.open,
		batchDownloadDialog.open,
		refetchMaterialTypes,
	]);

	const fetchUnmarkedList = useCallback(async (params: Record<string, unknown>) => {
		const { page, pageSize, shootDate, rest } = buildMaterialListBaseParams(params as Record<string, unknown>);
		const {
			cumTagId,
			orderBy: requestOrderBy,
			quality,
			...restWithoutType
		} = rest as Record<string, unknown> & {
			cumTagId?: number | number[];
			orderBy?: MaterialOrderBy;
			quality?: number;
		};
		const selectedTypeIds = toNumberArray(cumTagId);
		const normalizedRest = assignNormalizedBrandModelSeries(restWithoutType);
		const apiParams = sanitizeQueryParams({
			...normalizedRest,
			page,
			pageSize,
			orderBy: requestOrderBy,
			quality,
			shootDate,
			types: selectedTypeIds.length > 0 ? selectedTypeIds.join(",") : undefined,
		});

		try {
			return await materialService.getUnmarkedMaterials(apiParams);
		} catch (error) {
			message.error(getRequestErrorMessage(error, "获取素材列表失败"));
			throw error;
		}
	}, []);

	const handleDownload = useCallback(async (record: MaterialRow) => {
		message.success("视频下载中，请稍后...");
		await downloadMaterial(record, (row) => materialService.getMaterialDownloadUrl({ id: row.id }));
	}, []);

	const handleDelete = useCallback(
		async (record: MaterialRow, onSuccess?: () => void) => {
			if (rowMutating) return;
			setRowMutating(true);
			try {
				await materialService.deleteMaterial({ id: record.id });
				onSuccess?.();
				tableActionRef.current?.reload();
				message.success("删除成功");
			} catch (error) {
				message.error(getRequestErrorMessage(error, "删除失败"));
			} finally {
				setRowMutating(false);
			}
		},
		[rowMutating],
	);

	const handleDeleteWithConfirm = useCallback(
		(record: MaterialRow) => {
			Modal.confirm({
				title: "提示",
				content: "确定删除吗?",
				okText: "确定",
				cancelText: "取消",
				centered: true,
				onOk: () => handleDelete(record),
			});
		},
		[handleDelete],
	);

	const handleSingleAiRetry = useCallback(
		async (record: MaterialRow) => {
			if (rowMutating) return;
			setRowMutating(true);
			try {
				await materialService.generateAITags({ materialIds: [record.id] });
				message.success("AI打标请求已提交，正在处理中");
				tableActionRef.current?.reload();
			} catch (error) {
				message.error(getRequestErrorMessage(error, "AI重试失败"));
			} finally {
				setRowMutating(false);
			}
		},
		[rowMutating],
	);

	const handleAiRetryWithConfirm = useCallback(
		(record: MaterialRow) => {
			Modal.confirm({
				title: "提示",
				content: "确定为该素材生成AI标签吗？",
				okText: "确定",
				cancelText: "取消",
				centered: true,
				onOk: () => handleSingleAiRetry(record),
			});
		},
		[handleSingleAiRetry],
	);

	const handleBatchDeleteConfirm = useCallback(async () => {
		if (batchDeleteDialog.rows.length === 0) {
			batchDeleteDialog.closeDialog();
			return;
		}
		batchDeleteDialog.setLoading(true);
		try {
			const response = await materialService.batchDeleteMaterials({
				ids: batchDeleteDialog.rows.map((row) => row.id),
			});
			ensureApiSuccess(response, "批量删除失败");
			if (batchDeleteDialog.onSuccess) {
				batchDeleteDialog.onSuccess();
			} else {
				tableActionRef.current?.reload();
			}
			message.success("批量删除成功");
			batchDeleteDialog.resetDialog();
		} catch (error) {
			message.error(getRequestErrorMessage(error, "批量删除失败"));
		} finally {
			batchDeleteDialog.setLoading(false);
		}
	}, [batchDeleteDialog]);

	const handleBatchDownloadConfirm = useCallback(async () => {
		if (batchDownloadDialog.rows.length === 0) {
			batchDownloadDialog.closeDialog();
			return;
		}
		batchDownloadDialog.setLoading(true);
		try {
			await downloadMaterialsInBatch(batchDownloadDialog.rows, (row) =>
				materialService.getMaterialDownloadUrl({ id: row.id }),
			);
			batchDownloadDialog.onSuccess?.();
			message.success("批量下载已开始");
			batchDownloadDialog.resetDialog();
		} catch (error) {
			message.error(getRequestErrorMessage(error, "批量下载失败"));
		} finally {
			batchDownloadDialog.setLoading(false);
		}
	}, [batchDownloadDialog]);

	const openMaterialModal = useCallback((mode: MaterialEditMode, row?: MaterialRow, rows?: MaterialRow[]) => {
		setMaterialModalMode(mode);
		setMaterialModalRow(row ?? null);
		setMaterialModalRows(rows ?? []);
		setMaterialModalOpen(true);
	}, []);

	const closeMaterialModal = useCallback(() => {
		setMaterialModalOpen(false);
		setMaterialModalRow(null);
		setMaterialModalRows([]);
	}, []);

	const handleTableLoadSuccess = useCallback((rows: MaterialRow[]) => {
		shouldAutoRefreshRef.current = rows.some(
			(row) => row.aiTagStatus === AI_TAG_STATUS_PENDING || row.status === "marking_review_in_progress",
		);
	}, []);

	const handleTableLoadError = useCallback(() => {
		shouldAutoRefreshRef.current = false;
	}, []);

	const columns = useMemo<TableConfig<MaterialRow>["columns"]>(
		() => [
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
				render: (_: unknown, record: MaterialRow) => (
					<VideoInfo
						row={record}
						fileHost={requestFileHost}
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
			// 	ellipsis: true,
			// 	render: (_: unknown, record: MaterialRow) => {
			// 		return renderCarModelLines(record.carModelInfo);
			// 	},
			// },
			{
				title: "自定义分类",
				dataIndex: "currentTypes",
				key: "currentTypes",
				width: 180,
				ellipsis: true,
				render: (_: unknown, record: MaterialRow) => <TableTags tags={record.currentTypes} />,
			},
			{
				title: "拍摄人",
				dataIndex: "photographer",
				key: "photographer",
				width: 100,
				render: (v: unknown) => (v ? String(v) : "-"),
			},
			{
				title: "下载数",
				dataIndex: "downloadCount",
				key: "downloadCount",
				width: 80,
				align: "center",
				render: (v: unknown) => (v != null ? String(v) : "0"),
			},
			{
				title: "近期下载时间",
				dataIndex: "lastDownloadTime",
				key: "lastDownloadTime",
				width: 140,
				render: (v: unknown) => {
					return formatMaterialDate(v);
				},
			},
			{
				title: "拍摄时间",
				dataIndex: "shootTime",
				key: "shootTime",
				width: 120,
				render: (v: unknown) => {
					return formatMaterialDate(v);
				},
			},
			{
				title: "状态",
				dataIndex: "status",
				key: "status",
				width: 220,
				render: (_: unknown, record: MaterialRow) => {
					const statusConfig = getUnmarkedStatusConfig(record);
					return (
						<span className="inline-flex items-center gap-1.5 text-sm">
							<span
								className="size-2 shrink-0 rounded-full"
								style={{ backgroundColor: statusConfig.color }}
								aria-hidden
							/>
							<span className="truncate">{statusConfig.text || "-"}</span>
							{statusConfig.popoverContent && (
								<Popover
									title={statusConfig.popoverTitle ?? "原因"}
									content={statusConfig.popoverContent}
									placement="topLeft"
								>
									<span className="inline-flex size-3.25 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#cfd3dc] text-[8px]">
										!
									</span>
								</Popover>
							)}
						</span>
					);
				},
			},
			{
				title: "操作",
				dataIndex: "actions",
				key: "actions",
				width: 280,
				fixed: "right",
				render: (_: unknown, record: MaterialRow) => {
					const isReviewing = record.status === "marking_review_in_progress";
					const aiTagPending = record.aiTagStatus === AI_TAG_STATUS_PENDING;
					const aiTagFailed = record.aiTagStatus === AI_TAG_STATUS_FAILED;
					const canSupplement = canShowSupplementAction(record);
					const canReapply = record.status === "re_review_rejected";
					return (
						<Space className="flex w-full justify-start">
							{!aiTagPending && (
								<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
									<Button
										type="link"
										size="small"
										style={{ padding: 0 }}
										danger
										disabled={rowMutating}
										onClick={() => handleDeleteWithConfirm(record)}
									>
										删除
									</Button>
								</AuthGuard>
							)}
							{!isReviewing && (
								<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
									<Button
										type="link"
										size="small"
										style={{ padding: 0 }}
										disabled={rowMutating}
										onClick={() => openMaterialModal("edit", record)}
									>
										编辑
									</Button>
								</AuthGuard>
							)}
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button
									type="link"
									size="small"
									style={{ padding: 0 }}
									disabled={rowMutating}
									onClick={() => handleDownload(record)}
								>
									下载
								</Button>
							</AuthGuard>
							{canSupplement && (
								<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
									<Button
										type="link"
										size="small"
										style={{ padding: 0 }}
										disabled={rowMutating}
										onClick={() => openMaterialModal("supplement", record)}
									>
										补充标签
									</Button>
								</AuthGuard>
							)}
							{canReapply && (
								<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
									<Button
										type="link"
										size="small"
										style={{ padding: 0 }}
										disabled={rowMutating}
										onClick={() => openMaterialModal("reapply", record)}
									>
										重新申请
									</Button>
								</AuthGuard>
							)}
							{aiTagFailed && !isReviewing && (
								<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
									<Button
										type="link"
										size="small"
										style={{ padding: 0 }}
										disabled={rowMutating}
										onClick={() => handleAiRetryWithConfirm(record)}
									>
										AI重试
									</Button>
								</AuthGuard>
							)}
						</Space>
					);
				},
			},
		],
		[handleDeleteWithConfirm, handleDownload, handleSingleAiRetry, openMaterialModal, requestFileHost, rowMutating],
	);

	const dataSourceConfig = useMemo<TableConfig<MaterialRow>["dataSource"]>(
		() => ({
			api: fetchUnmarkedList,
			defaultParams: {
				orderBy,
				quality: premiumOnly ? 2 : undefined,
			},
			transform: transformMaterialListResponse,
		}),
		[fetchUnmarkedList, orderBy, premiumOnly],
	);

	const tableConfig = useMemo<TableConfig<MaterialRow>>(
		() => ({
			rowKey: "id",
			render:
				viewMode === "card"
					? (ctx) => (
							<MaterialCardView
								{...ctx}
								fileHost={requestFileHost}
								onCorrect={
									authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
										? (record) => openMaterialModal("edit", record)
										: undefined
								}
								onDownload={authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage) ? handleDownload : undefined}
								onDelete={
									authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage) ? handleDeleteWithConfirm : undefined
								}
								correctText="编辑"
								onSupplement={
									authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
										? (record) => openMaterialModal("supplement", record)
										: undefined
								}
								onReapply={
									authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
										? (record) => openMaterialModal("reapply", record)
										: undefined
								}
								onAiRetry={
									authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
										? (record) => handleAiRetryWithConfirm(record)
										: undefined
								}
							/>
						)
					: undefined,
			dataSource: dataSourceConfig,
			events: {
				onLoadSuccess: handleTableLoadSuccess,
				onLoadError: handleTableLoadError,
			},
			scroll: { x: "max-content", y: 520 },
			sticky: true,
			paginationMode: "auto",
			rowSelection: true,
			search: {
				showAdvanced: false,
				initialVisibleCount: 5,
				searchButtonText: "搜索",
				resetButtonText: "重置",
				onReset: () => {
					setOrderBy("time");
					setPremiumOnly(false);
				},
				responsive: {
					...materialCenterSearchResponsive,
				},
				fields: [
					{
						name: "brandModelSeries",
						label: "品牌/车系/车型",
						type: "brandTreeSelect",
						placeholder: "请选择",
					},
					{
						name: "shootDate",
						label: "拍摄时间",
						type: "daterange",
						span: 1,
						submitAs: { start: "shootDateStart", end: "shootDateEnd" },
						props: {
							format: "YYYY-MM-DD",
							disabledDate: (current: dayjs.Dayjs) =>
								Boolean(current) && current.valueOf() > dayjs().endOf("day").valueOf(),
						},
					},
					{
						name: "status",
						label: "素材状态",
						type: "select",
						placeholder: "请选择素材状态",
						options: [...STATUS_OPTIONS],
					},
					{
						name: "photographer",
						label: "拍摄人",
						type: "select",
						placeholder: "请选择拍摄人",
						options: photographerOptions,
					},
					{
						name: "cumTagId",
						label: "自定义分类",
						type: "multiSelect",
						span: { xs: 1, md: 3, lg: 4, xl: 4 },
						options: materialTypeSearchOptions,
						submitOnChange: true,
						props: {
							displayAsTagList: true,
						},
					},
				],
				onValuesChange: (changedValues) => {
					if ("cumTagId" in changedValues) {
						void refetchMaterialTypes();
					}
				},
			},
			toolbar: {
				align: "right",
				customActions: [
					{
						text: "上传素材",
						render: () => (
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button
									type="primary"
									icon={<Icon icon="solar:upload-outline" />}
									onClick={() => setUploadDialogOpen(true)}
								>
									上传素材
								</Button>
							</AuthGuard>
						),
					},
					{
						text: "优质素材",
						render: () => (
							<Button type={premiumOnly ? "primary" : "default"} onClick={() => setPremiumOnly((value) => !value)}>
								优质素材
							</Button>
						),
					},
					{
						text: "排序",
						render: () => {
							const sortMenuItems: MenuProps["items"] = MATERIAL_SORT_OPTIONS.map((item) => ({
								key: item.value,
								label: <span className="inline-block w-30">{item.label}</span>,
								icon: (
									<span className="inline-flex w-4 justify-center">
										<Icon
											icon="solar:check-read-outline"
											className={orderBy === item.value ? "text-primary" : "invisible"}
										/>
									</span>
								),
							}));
							return (
								<Dropdown
									menu={{
										items: sortMenuItems,
										onClick: ({ key }) => setOrderBy(key as MaterialOrderBy),
									}}
									placement="bottomRight"
									trigger={["click"]}
								>
									<Button type="primary" icon={<Icon icon="lucide:arrow-up-down" />}>
										排序
									</Button>
								</Dropdown>
							);
						},
					},
					{
						text: "切换视图",
						onClick: () => setViewMode((v) => (v === "list" ? "card" : "list")),
						type: "default",
						icon: (
							<Icon
								icon={viewMode === "list" ? "icon-park-outline:table" : "solar:widget-5-outline"}
								className="mr-1"
							/>
						),
					},
				],
			},
			batchActions: (
				[
					authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
						? {
								text: "批量删除",
								action: "delete",
								requireSelection: true,
								disabled: batchDeleteDialog.loading || batchDownloadDialog.loading || rowMutating,
								onClick: (rows: MaterialRow[], onSuccess?: () => void) => {
									const hasAiPending = rows.some((row) => row.aiTagStatus === AI_TAG_STATUS_PENDING);
									if (hasAiPending) {
										message.warning("所选素材存在AI打标中状态，请重新选择。");
										return;
									}
									batchDeleteDialog.openDialog(rows, () => {
										onSuccess?.();
										tableActionRef.current?.reload();
									});
								},
							}
						: null,
					authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
						? {
								text: "批量下载",
								action: "export",
								requireSelection: true,
								disabled: batchDeleteDialog.loading || batchDownloadDialog.loading || rowMutating,
								onClick: (rows: MaterialRow[], onSuccess?: () => void) => {
									batchDownloadDialog.openDialog(rows, onSuccess ?? null);
								},
							}
						: null,
					authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
						? {
								text: "批量补充标签",
								action: "batch-supplement",
								requireSelection: true,
								disabled: batchDeleteDialog.loading || batchDownloadDialog.loading || rowMutating,
								onClick: (rows: MaterialRow[]) => {
									const hasInvalid = rows.some(
										(row) =>
											!(authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage) && canShowSupplementAction(row)),
									);
									if (hasInvalid) {
										message.warning("只能选择行操作中有“补充标签”按钮的数据进行批量补充标签。");
										return;
									}
									openMaterialModal("batchSupplement", undefined, rows);
								},
							}
						: null,
					authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
						? {
								text: "批量编辑",
								action: "batch-edit",
								requireSelection: true,
								disabled: batchDeleteDialog.loading || batchDownloadDialog.loading || rowMutating,
								onClick: (rows: MaterialRow[]) => {
									const hasReviewing = rows.some((row) => row.status === "marking_review_in_progress");
									if (hasReviewing) {
										message.warning("所选素材存在打标审核中状态，请重新选择。");
										return;
									}
									openMaterialModal("batchEdit", undefined, rows);
								},
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
			dataSourceConfig,
			handleDelete,
			handleDownload,
			handleTableLoadError,
			handleTableLoadSuccess,
			materialTypeSearchOptions,
			orderBy,
			photographerOptions,
			rowMutating,
			requestFileHost,
			openMaterialModal,
			viewMode,
			batchDeleteDialog.loading,
			batchDeleteDialog.open,
			batchDownloadDialog.loading,
			batchDownloadDialog.open,
		],
	);

	return (
		<div className="space-y-4">
			<ConfigTable config={tableConfig} actionRef={tableActionRef} />

			<Modal
				title="提示"
				open={batchDeleteDialog.open}
				centered
				onCancel={batchDeleteDialog.closeDialog}
				footer={
					<div className="flex justify-end gap-2">
						<Button disabled={batchDeleteDialog.loading} onClick={batchDeleteDialog.closeDialog}>
							取消
						</Button>
						<Button type="primary" loading={batchDeleteDialog.loading} onClick={handleBatchDeleteConfirm}>
							确定
						</Button>
					</div>
				}
			>
				<div className="flex items-start gap-3">
					<Icon
						icon="solar:danger-circle-bold"
						className="mt-0.5 shrink-0 text-(--ant-color-warning)"
						width={22}
						height={22}
					/>
					<span>确定删除选中的{batchDeleteDialog.rows.length}项素材吗？</span>
				</div>
			</Modal>

			<Modal
				title="批量下载提示"
				open={batchDownloadDialog.open}
				centered
				onCancel={batchDownloadDialog.closeDialog}
				footer={
					<div className="flex justify-end gap-2">
						<Button disabled={batchDownloadDialog.loading} onClick={batchDownloadDialog.closeDialog}>
							取消
						</Button>
						<Button type="primary" loading={batchDownloadDialog.loading} onClick={handleBatchDownloadConfirm}>
							开始下载
						</Button>
					</div>
				}
			>
				<div className="flex items-start gap-3">
					<Icon
						icon="solar:info-circle-bold"
						className="mt-0.5 shrink-0 text-(--ant-color-text-secondary)"
						width={22}
						height={22}
					/>
					<span>
						即将下载{batchDownloadDialog.rows.length}
						个文件,下载过程中请勿关闭浏览器窗口。
					</span>
				</div>
			</Modal>

			<MaterialTagEditModal
				open={materialModalOpen}
				mode={materialModalMode}
				row={materialModalRow}
				rows={materialModalRows}
				fileHost={requestFileHost}
				onClose={closeMaterialModal}
				onSuccess={() => {
					tableActionRef.current?.reload();
					refetchMaterialTypes();
				}}
			/>
			<MaterialUploadDialog
				open={uploadDialogOpen}
				onOpenChange={setUploadDialogOpen}
				onClose={() => setUploadDialogOpen(false)}
				onSuccess={() => {
					tableActionRef.current?.reload();
					refetchMaterialTypes();
				}}
			/>
		</div>
	);
}

export default UnmarkPage;
