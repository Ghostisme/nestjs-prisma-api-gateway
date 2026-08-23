/** 已打标素材列表页：筛选、排序、表格、分页、批量操作、操作（纠错/下载） */

import { useQuery } from "@tanstack/react-query";
import type { MenuProps } from "antd";
import { App, Button, Dropdown, Modal, Popover, Space } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";
import materialService from "@/api/material/materialService";
import { getTagListApi } from "@/api/material/tagService";
import type { MaterialRow } from "@/api/material/types";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthCheck } from "@/components/auth/use-auth";
import { Icon } from "@/components/icon";
import { TableTags } from "@/components/TableTags";
import type { TableAction, TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { VideoInfo } from "@/components/VideoInfo";
import { MaterialCardView } from "@/pages/materialCenter/components/cardTable";
import { MaterialTagEditModal } from "@/pages/materialCenter/components/MaterialTagEditModal";
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
import { updatedStatus } from "@/utils/materialStatus";

const TAG_LIST_PAGE_SIZE = 1000;
const STATUS_COLOR_MAP: Record<string, string> = {
	pending_tagging: "#E6A23C",
	marking_review_in_progress: "#FF7D00",
	re_review_rejected: "#F53F3F",
	revision_pending_review: "#FF7D00",
	revision_rejected: "#F53F3F",
	approved: "#67C23A",
	deleted: "#909399",
};

function MarkPage() {
	const { message } = App.useApp();
	const authCheck = useAuthCheck("permission");
	const tableActionRef = useRef<TableAction | null>(null);
	const [orderBy, setOrderBy] = useState<MaterialOrderBy>("time");
	const [premiumOnly, setPremiumOnly] = useState(false);
	const [viewMode, setViewMode] = useState<MaterialViewMode>("list");
	const [rowMutating, setRowMutating] = useState(false);
	const [correctModalOpen, setCorrectModalOpen] = useState(false);
	const [correctModalRow, setCorrectModalRow] = useState<MaterialRow | null>(null);
	const batchDeleteDialog = useMaterialBatchDialog<MaterialRow>();
	const batchDownloadDialog = useMaterialBatchDialog<MaterialRow>();

	const requestFileHost = useRequestFileHost();
	const { data: photographers = [] } = useQuery({
		queryKey: ["material-photographers"],
		queryFn: () => materialService.getPhotographers(),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});
	const { data: tagListRes } = useQuery({
		queryKey: ["material-tag-list", { pageSize: TAG_LIST_PAGE_SIZE }],
		queryFn: () => getTagListApi({ pageSize: TAG_LIST_PAGE_SIZE }),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});

	const photographerOptions = useMemo(
		() => photographers.map((name) => ({ label: name, value: name })),
		[photographers],
	);

	/** 根据 tag/list 的 list 动态生成搜索条件：每个一级 item.name 为 label，sub_tags 为 options */
	const dynamicTagFields = useMemo(() => {
		const list = tagListRes?.list ?? [];
		return list.map((item) => {
			const fieldName = item.type ?? `tag_${item.id}`;
			const options =
				(item.subTags ?? []).length > 0
					? (item.subTags ?? []).map((sub) => ({
							label: sub.name,
							value: sub.id,
						}))
					: [{ label: item.name, value: item.id }];
			return {
				name: fieldName,
				label: item.name,
				type: "select" as const,
				placeholder: "请选择",
				options,
			};
		});
	}, [tagListRes?.list]);

	const tagFieldNameSet = useMemo(
		() => new Set((tagListRes?.list ?? []).map((t) => t.type ?? `tag_${t.id}`)),
		[tagListRes?.list],
	);

	const fetchMarkedList = useCallback(
		async (params: Record<string, unknown>) => {
			const { page, pageSize, shootDate, rest } = buildMaterialListBaseParams(params);
			const mergedTagIds: number[] = [];
			const restForApi = assignNormalizedBrandModelSeries(rest);
			for (const [key, value] of Object.entries(restForApi)) {
				if (!tagFieldNameSet.has(key)) continue;
				mergedTagIds.push(...toNumberArray(value as number | number[] | undefined));
				delete restForApi[key];
			}
			const uniqueTagIds = [...new Set(mergedTagIds)];
			const apiParams = sanitizeQueryParams({
				...restForApi,
				page,
				pageSize,
				shootDate,
				tagIds: uniqueTagIds.length > 0 ? uniqueTagIds.join(",") : undefined,
			});
			return materialService.getMarkedMaterials(apiParams);
		},
		[tagFieldNameSet],
	);

	const handleCorrect = useCallback((record: MaterialRow) => {
		setCorrectModalRow(record);
		setCorrectModalOpen(true);
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
			// 	title: "品牌车系车型",
			// 	dataIndex: "carModelInfo",
			// 	key: "carModelInfo",
			// 	width: 200,
			// 	ellipsis: true,
			// 	render: (_: unknown, record: MaterialRow) => {
			// 		return renderCarModelLines(record.carModelInfo);
			// 	},
			// },
			{
				title: "AI 标签",
				dataIndex: "aiTags",
				key: "aiTags",
				width: 160,
				ellipsis: true,
				render: (_: unknown, record: MaterialRow) => <TableTags tags={record.aiTags} />,
			},
			{
				title: "人工标签",
				dataIndex: "currentTags",
				key: "currentTags",
				width: 160,
				ellipsis: true,
				render: (_: unknown, record: MaterialRow) => <TableTags tags={record.currentTags} />,
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
				title: "最近下载时间",
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
				width: 200,
				render: (_: unknown, record: MaterialRow) => {
					const status = record.status ?? "approved";
					const statusConfig = updatedStatus[status];
					const text =
						typeof statusConfig === "object" && statusConfig !== null
							? statusConfig.default || (record.tagSource && statusConfig[record.tagSource]) || "-"
							: (statusConfig ?? "");
					const color = STATUS_COLOR_MAP[status] ?? "#909399";
					return (
						<span className="inline-flex items-center gap-1.5 text-sm">
							<span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
							<span className="truncate">{text || "-"}</span>
							{status === "revision_rejected" && record.reason && (
								<Popover title="原因" content={record.reason} placement="topLeft">
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
					const status = record.status ?? "";
					const canCorrect = status === "approved" || status === "revision_rejected";
					return (
						<Space className="flex w-full justify-start">
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button
									type="link"
									size="small"
									style={{ padding: 0 }}
									onClick={() => handleDeleteWithConfirm(record)}
									danger
									disabled={rowMutating}
								>
									删除
								</Button>
							</AuthGuard>

							{canCorrect && (
								<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
									<Button
										type="link"
										size="small"
										style={{ padding: 0 }}
										disabled={rowMutating}
										onClick={() => handleCorrect(record)}
									>
										修正
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
						</Space>
					);
				},
			},
		],
		[requestFileHost, handleCorrect, handleDownload, handleDelete, rowMutating],
	);

	// 与接口请求相关的 dataSource 不依赖 viewMode，避免切换列表/卡片视图时触发 refetch
	const dataSourceConfig = useMemo<TableConfig<MaterialRow>["dataSource"]>(
		() => ({
			api: fetchMarkedList,
			defaultParams: {
				orderBy,
				quality: premiumOnly ? 2 : undefined,
			},
			transform: transformMaterialListResponse,
		}),
		[fetchMarkedList, orderBy, premiumOnly],
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
								onCorrect={authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage) ? handleCorrect : undefined}
								onDownload={authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage) ? handleDownload : undefined}
								onDelete={
									authCheck.check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage) ? handleDeleteWithConfirm : undefined
								}
								correctText="修正"
							/>
						)
					: undefined,
			dataSource: dataSourceConfig,
			scroll: { x: "max-content", y: 520 },
			sticky: true,
			paginationMode: "auto",
			rowSelection: true,
			search: {
				showAdvanced: dynamicTagFields.length > 9,
				initialVisibleCount: 12,
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
						name: "photographer",
						label: "拍摄人",
						type: "select",
						placeholder: "请选择拍摄人",
						options: photographerOptions,
					},
					...dynamicTagFields,
				],
			},
			toolbar: {
				align: "right",
				customActions: [
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
			dataSourceConfig,
			columns,
			photographerOptions,
			dynamicTagFields,
			viewMode,
			orderBy,
			requestFileHost,
			handleCorrect,
			handleDownload,
			handleDelete,
			rowMutating,
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
				open={correctModalOpen}
				mode={"correct"}
				row={correctModalRow}
				fileHost={requestFileHost}
				onClose={() => {
					setCorrectModalOpen(false);
					setCorrectModalRow(null);
				}}
				onSuccess={() => {
					tableActionRef.current?.reload();
				}}
			/>
		</div>
	);
}

export default MarkPage;
