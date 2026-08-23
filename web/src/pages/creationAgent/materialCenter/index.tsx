import { App, Button, Dropdown, Input, InputNumber, Modal, Space } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { rawMaterialService, type RawMaterialNode } from "@/api/creationAgent";
import { Icon } from "@/components/icon";
import type { TableAction, TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { getRequestErrorMessage, MATERIAL_PAGE_SIZE } from "@/pages/materialCenter/shared";
import { materialCenterSearchResponsive } from "@/pages/materialCenter/utils";
import { RawMaterialUploadDialog } from "./components/RawMaterialUploadDialog";

function UnmarkPage() {
	const { message } = App.useApp();
	const tableActionRef = useRef<TableAction | null>(null);

	const [activeSubTab, setActiveSubTab] = useState("all");
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [folderModalOpen, setFolderModalOpen] = useState(false);
	const [folderName, setFolderName] = useState("");
	const [folderMutating, setFolderMutating] = useState(false);

	const [renameModalOpen, setRenameModalOpen] = useState(false);
	const [renameId, setRenameId] = useState<number | null>(null);
	const [renameName, setRenameName] = useState("");
	const [renameMutating, setRenameMutating] = useState(false);

	const [moveModalOpen, setMoveModalOpen] = useState(false);
	const [moveId, setMoveId] = useState<number | null>(null);
	const [moveTargetId, setMoveTargetId] = useState<number | null>(0);
	const [moveMutating, setMoveMutating] = useState(false);

	const [previewModalOpen, setPreviewModalOpen] = useState(false);
	const [previewUrl, setPreviewUrl] = useState("");
	const [previewMediaType, setPreviewMediaType] = useState<"video" | "image">("image");

	const handlePreview = async (record: RawMaterialNode) => {
		try {
			const url = await rawMaterialService.getDownloadUrl(record.id);
			if (url) {
				setPreviewUrl(url);
				setPreviewMediaType(record.mediaType === "video" ? "video" : "image");
				setPreviewModalOpen(true);
			}
		} catch (_e) {
			message.error("获取预览地址失败");
		}
	};

	useEffect(() => {
		tableActionRef.current?.reload({ resetPage: true });
	}, [activeSubTab]);

	const handleMove = async () => {
		if (!moveId) return;
		if (moveTargetId === null) {
			message.warning("请输入目标文件夹ID");
			return;
		}
		setMoveMutating(true);
		try {
			await rawMaterialService.moveNode(moveId, { targetParentId: moveTargetId });
			message.success("移动成功");
			setMoveModalOpen(false);
			setMoveId(null);
			setMoveTargetId(0);
			tableActionRef.current?.reload();
		} catch (error) {
			message.error(getRequestErrorMessage(error, "移动失败"));
		} finally {
			setMoveMutating(false);
		}
	};

	const handleRename = async () => {
		if (!renameId) return;
		if (!renameName.trim()) {
			message.warning("请输入新名称");
			return;
		}
		setRenameMutating(true);
		try {
			await rawMaterialService.updateNode(renameId, { name: renameName.trim() });
			message.success("重命名成功");
			setRenameModalOpen(false);
			setRenameId(null);
			setRenameName("");
			tableActionRef.current?.reload();
		} catch (error) {
			message.error(getRequestErrorMessage(error, "重命名失败"));
		} finally {
			setRenameMutating(false);
		}
	};

	const handleCreateFolder = async () => {
		if (!folderName.trim()) {
			message.warning("请输入文件夹名称");
			return;
		}
		setFolderMutating(true);
		try {
			await rawMaterialService.createFolder({
				parentId: currentParentId,
				name: folderName.trim(),
			});
			message.success("新建文件夹成功");
			setFolderModalOpen(false);
			setFolderName("");
			tableActionRef.current?.reload();
		} catch (error) {
			message.error(getRequestErrorMessage(error, "新建文件夹失败"));
		} finally {
			setFolderMutating(false);
		}
	};

	const [navPath, setNavPath] = useState<{ id: number; name: string }[]>([{ id: 0, name: "库根" }]);
	const currentParentId = navPath[navPath.length - 1]?.id ?? 0;

	const fetchRawMaterialList = useCallback(
		async (params: Record<string, unknown>) => {
			const { page, pageSize, ...rest } = params as { page: number; pageSize: number; [key: string]: unknown };

			const apiParams = {
				parentId: currentParentId,
				page: page || 1,
				pageSize: pageSize || MATERIAL_PAGE_SIZE,
				mediaTypeView: activeSubTab === "all" ? undefined : (activeSubTab as "video" | "image"),
				preReviewStatus: rest.status as string,
				brandId: rest.brandModelSeries ? (rest.brandModelSeries as any)[0] : undefined,
				vehicleModelId: rest.brandModelSeries ? (rest.brandModelSeries as any)[1] : undefined,
			};

			try {
				const res = await rawMaterialService.getList(apiParams);
				return {
					list: res.list,
					total: res.total,
				};
			} catch (error) {
				message.error(getRequestErrorMessage(error, "获取原料列表失败"));
				throw error;
			}
		},
		[currentParentId, activeSubTab],
	);

	const handleTableLoadError = useCallback(() => {
		// handle error
	}, []);

	const columns = useMemo<TableConfig<RawMaterialNode>["columns"]>(
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
				title: "名称",
				dataIndex: "name",
				key: "name",
				width: 320,
				align: "left",
				render: (_: unknown, record: RawMaterialNode) => {
					const isFolder = record.nodeType === "FOLDER";
					return (
						<div className="flex items-center gap-3">
							<div
								className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-lg ${
									isFolder ? "bg-[#fff7e6] text-[#faad14]" : "bg-[#e6f4ff] text-(--ant-color-primary)"
								}`}
							>
								{isFolder ? (
									<Icon icon="solar:folder-bold" />
								) : record.mediaType === "image" ? (
									<Icon icon="material-symbols:image-rounded" />
								) : (
									<Icon icon="solar:video-frame-bold" />
								)}
							</div>
							<div>
								<button
									type="button"
									className={`font-medium hover:text-(--ant-color-primary) ${isFolder ? "cursor-pointer" : "cursor-pointer"}`}
									onClick={() => {
										if (isFolder) {
											setNavPath((prev) => [...prev, { id: record.id, name: record.name }]);
											tableActionRef.current?.reload({ resetPage: true });
										} else {
											handlePreview(record);
										}
									}}
								>
									{record.name}
								</button>
								<div className="mt-0.5 font-mono text-xs text-(--ant-color-text-secondary)">ID: {record.id}</div>
							</div>
						</div>
					);
				},
			},
			{
				title: "类型",
				dataIndex: "nodeType",
				key: "nodeType",
				width: 100,
				render: (_: unknown, record: RawMaterialNode) => {
					const isFolder = record.nodeType === "FOLDER";
					return (
						<span
							className={`inline-block h-[22px] rounded px-2 text-xs leading-[22px] ${
								isFolder
									? "bg-[#fff7e6] text-[#d48806] cursor-pointer hover:bg-[#ffe7aa]"
									: "bg-[#f0f5ff] text-[#2f54eb]"
							}`}
							onClick={() => {
								if (isFolder) {
									setNavPath((prev) => [...prev, { id: record.id, name: record.name }]);
									tableActionRef.current?.reload({ resetPage: true });
								}
							}}
						>
							{isFolder ? "文件夹" : "原料"}
						</span>
					);
				},
			},
			{
				title: "预审状态",
				dataIndex: "preReviewStatus",
				key: "preReviewStatus",
				width: 120,
				render: (_: unknown, record: RawMaterialNode) => {
					return (
						<span className="inline-block h-[22px] rounded bg-[#f5f5f5] px-2 text-xs leading-[22px] text-[#595959]">
							{record.preReviewStatus || "—"}
						</span>
					);
				},
			},
			{
				title: "媒体",
				dataIndex: "mediaType",
				key: "mediaType",
				width: 100,
				render: (_: unknown, record: RawMaterialNode) => record.mediaType || "—",
			},
			{
				title: "大小",
				dataIndex: "sizeBytes",
				key: "sizeBytes",
				width: 100,
				render: (_: unknown, record: RawMaterialNode) => {
					if (record.nodeType === "FOLDER") return "—";
					const bytes = Number(record.sizeBytes);
					if (!bytes || Number.isNaN(bytes)) return "—";
					if (bytes < 1024) return `${bytes} B`;
					if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
					return `${(bytes / 1048576).toFixed(2)} MB`;
				},
			},
			{
				title: "更新时间",
				dataIndex: "updateTime",
				key: "updateTime",
				width: 180,
				render: (_: unknown, record: RawMaterialNode) => {
					if (!record.updateTime) return "—";
					return dayjs(record.updateTime).format("YYYY-MM-DD HH:mm:ss");
				},
			},
			{
				title: "操作",
				dataIndex: "actions",
				key: "actions",
				width: 280,
				fixed: "right",
				render: (_: unknown, record: RawMaterialNode) => {
					const isFolder = record.nodeType === "FOLDER";
					return (
						<Space className="flex w-full justify-start">
							{isFolder && (
								<Button
									type="link"
									size="small"
									style={{ padding: 0 }}
									onClick={() => {
										setNavPath((prev) => [...prev, { id: record.id, name: record.name }]);
										tableActionRef.current?.reload({ resetPage: true });
									}}
								>
									进入
								</Button>
							)}
							<Button
								type="link"
								size="small"
								style={{ padding: 0 }}
								onClick={() => {
									setRenameId(record.id);
									setRenameName(record.name);
									setRenameModalOpen(true);
								}}
							>
								重命名
							</Button>
							<Button
								type="link"
								size="small"
								style={{ padding: 0 }}
								onClick={() => {
									setMoveId(record.id);
									setMoveTargetId(0);
									setMoveModalOpen(true);
								}}
							>
								移动
							</Button>
							{!isFolder && (
								<Button
									type="link"
									size="small"
									style={{ padding: 0 }}
									onClick={async () => {
										try {
											const res = await rawMaterialService.getDownloadUrl(record.id);
											if (res) {
												window.open(res, "_blank");
											}
										} catch (_e) {
											message.error("下载失败");
										}
									}}
								>
									下载
								</Button>
							)}
							<Button
								type="link"
								size="small"
								style={{ padding: 0 }}
								danger
								onClick={() => {
									Modal.confirm({
										title: "提示",
										content: isFolder ? "确认删除该文件夹及其下全部内容？" : "确认删除该原料？",
										onOk: async () => {
											try {
												await rawMaterialService.deleteNode(record.id);
												message.success("删除成功");
												tableActionRef.current?.reload();
											} catch (_e) {
												message.error("删除失败");
											}
										},
									});
								}}
							>
								删除
							</Button>
						</Space>
					);
				},
			},
		],
		[setNavPath],
	);

	const dataSourceConfig = useMemo<TableConfig<RawMaterialNode>["dataSource"]>(
		() => ({
			api: fetchRawMaterialList,
			defaultParams: {},
			transform: (res: any) => ({ list: res.list, total: res.total }),
		}),
		[fetchRawMaterialList],
	);

	const tableConfig = useMemo<TableConfig<RawMaterialNode>>(
		() => ({
			rowKey: "id",
			dataSource: dataSourceConfig,
			events: {
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
					// reset custom states if any
				},
				responsive: {
					...materialCenterSearchResponsive,
				},
				fields: [
					{
						name: "status",
						label: "预审状态",
						type: "select" as const,
						placeholder: "请选择",
						options: [
							{ label: "未申请审核", value: "pending_tagging" },
							{ label: "审核中", value: "marking_review_in_progress" },
							{ label: "未通过", value: "re_review_rejected" },
						],
					},
					{
						name: "brandModelSeries",
						label: "品牌/车型",
						type: "brandTreeSelect",
						placeholder: "请选择",
					},
				],
			},
			toolbar: {
				align: "right",
				customActions: [],
			},
			batchActions: [],
			pagination: {
				pageSize: MATERIAL_PAGE_SIZE,
				pageSizeOptions: [10, 20, 50],
				showSizeChanger: true,
				showQuickJumper: false,
				showTotal: (total) => `共${total}条`,
			},
			columns,
		}),
		[columns, dataSourceConfig, handleTableLoadError],
	);

	const renderRawMaterial = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Space>
					<Button type={activeSubTab === "all" ? "primary" : "default"} onClick={() => setActiveSubTab("all")}>
						全部
					</Button>
					<Button type={activeSubTab === "video" ? "primary" : "default"} onClick={() => setActiveSubTab("video")}>
						视频
					</Button>
					<Button type={activeSubTab === "image" ? "primary" : "default"} onClick={() => setActiveSubTab("image")}>
						图片
					</Button>
				</Space>
				<Space>
					<Dropdown
						menu={{
							items: [
								{
									key: "local",
									label: "本地上传",
									onClick: () => setUploadDialogOpen(true),
								},
							],
						}}
						trigger={["click"]}
					>
						<Button type="primary" className="flex items-center gap-1">
							上传原料 <Icon icon="solar:alt-arrow-down-linear" />
						</Button>
					</Dropdown>
					<Button onClick={() => setFolderModalOpen(true)}>新建文件夹</Button>
				</Space>
			</div>

			<div className="flex items-center gap-2 text-sm text-(--ant-color-text-secondary)">
				{navPath.map((item, index) => (
					<span key={item.id} className="flex items-center gap-2">
						{index > 0 && <span className="text-[#d9d9d9]">/</span>}
						{index === navPath.length - 1 ? (
							<span className="font-medium text-(--ant-color-text)">{item.name}</span>
						) : (
							<button
								type="button"
								className="cursor-pointer hover:text-(--ant-color-primary)"
								onClick={() => {
									setNavPath((prev) => prev.slice(0, index + 1));
									tableActionRef.current?.reload({ resetPage: true });
								}}
							>
								{item.name}
							</button>
						)}
					</span>
				))}
				{navPath.length > 1 && (
					<Button
						type="link"
						size="small"
						className="ml-2"
						onClick={() => {
							setNavPath((prev) => prev.slice(0, -1));
							tableActionRef.current?.reload({ resetPage: true });
						}}
					>
						返回上级
					</Button>
				)}
			</div>

			<ConfigTable config={tableConfig} actionRef={tableActionRef} />

			<Modal
				title="新建文件夹"
				open={folderModalOpen}
				centered
				onCancel={() => setFolderModalOpen(false)}
				onOk={handleCreateFolder}
				confirmLoading={folderMutating}
			>
				<div className="pt-4">
					<Input
						placeholder="请输入文件夹名称"
						value={folderName}
						onChange={(e) => setFolderName(e.target.value)}
						onPressEnter={handleCreateFolder}
						autoFocus
					/>
				</div>
			</Modal>

			<Modal
				title="重命名"
				open={renameModalOpen}
				centered
				onCancel={() => setRenameModalOpen(false)}
				onOk={handleRename}
				confirmLoading={renameMutating}
			>
				<div className="pt-4">
					<Input
						placeholder="请输入新名称"
						value={renameName}
						onChange={(e) => setRenameName(e.target.value)}
						onPressEnter={handleRename}
						autoFocus
					/>
				</div>
			</Modal>

			<Modal
				title="移动到目录"
				open={moveModalOpen}
				centered
				onCancel={() => setMoveModalOpen(false)}
				onOk={handleMove}
				confirmLoading={moveMutating}
			>
				<div className="pt-4">
					<div className="mb-2 text-sm text-(--ant-color-text-secondary)">目标 parentId（0 为库根）</div>
					<InputNumber
						className="w-full"
						placeholder="请输入目标文件夹ID"
						value={moveTargetId}
						onChange={setMoveTargetId}
						onPressEnter={handleMove}
						autoFocus
					/>
				</div>
			</Modal>

			<RawMaterialUploadDialog
				open={uploadDialogOpen}
				parentId={currentParentId}
				onClose={() => setUploadDialogOpen(false)}
				onSuccess={() => {
					tableActionRef.current?.reload();
				}}
			/>

			<Modal
				title="预览"
				open={previewModalOpen}
				centered
				footer={null}
				width={previewMediaType === "video" ? 720 : 520}
				onCancel={() => {
					setPreviewModalOpen(false);
					setPreviewUrl("");
				}}
			>
				<div className="flex items-center justify-center py-4">
					{previewMediaType === "image" ? (
						<img src={previewUrl} alt="preview" className="max-h-[60vh] max-w-full" />
					) : (
						<video src={previewUrl} controls className="max-h-[60vh] max-w-full">
							<track kind="captions" />
						</video>
					)}
				</div>
			</Modal>
		</div>
	);

	return renderRawMaterial();
}

export default UnmarkPage;
