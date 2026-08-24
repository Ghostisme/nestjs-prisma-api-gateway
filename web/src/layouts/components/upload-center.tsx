import { Button, Empty, Modal, Pagination, Spin } from "antd";
import { useCallback, useState } from "react";
import materialService from "@/api/material/materialService";
import type { MaterialRow } from "@/api/material/types";
import { Icon } from "@/components/icon";
import { VideoInfo } from "@/components/VideoInfo";
import { MaterialTagEditModal } from "@/pages/materialCenter/components/MaterialTagEditModal";
import { AppTabs } from "@/pages/materialCenter/components/AppTabs";
import { useRequestFileHost } from "@/store/appStore";
import { getDisplayStatus } from "@/utils/materialStatus";

const UPLOAD_CENTER_TABS = [
	{ label: "All", value: "" },
	{ label: "Under Review", value: "marking_review_in_progress,re_review_rejected" },
	{ label: "Revision", value: "revision_pending_review" },
] as const;

const DEFAULT_PAGE_SIZE = 20;

export function UploadCenter() {
	const fileHost = useRequestFileHost();
	const [open, setOpen] = useState(false);
	const [activeTab, setActiveTab] = useState(0);
	const [loading, setLoading] = useState(false);
	const [materialList, setMaterialList] = useState<MaterialRow[]>([]);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [total, setTotal] = useState(0);
	const [reapplyRow, setReapplyRow] = useState<MaterialRow | null>(null);
	const [reapplyOpen, setReapplyOpen] = useState(false);

	const fetchMaterials = useCallback(async (status: string, currentPage: number, currentPageSize: number) => {
		setLoading(true);
		try {
			const res = await materialService.getMyMaterialList({ status, page: currentPage, pageSize: currentPageSize });
			setMaterialList(res.list ?? []);
			setTotal(res.total ?? 0);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleOpen = () => {
		setOpen(true);
		void fetchMaterials(UPLOAD_CENTER_TABS[activeTab].value, 1, pageSize);
	};

	const handleTabChange = (index: number) => {
		setActiveTab(index);
		setPage(1);
		void fetchMaterials(UPLOAD_CENTER_TABS[index].value, 1, pageSize);
	};

	const handlePageChange = (newPage: number, newPageSize: number) => {
		setPage(newPage);
		setPageSize(newPageSize);
		void fetchMaterials(UPLOAD_CENTER_TABS[activeTab].value, newPage, newPageSize);
	};

	const handleReapply = (row: MaterialRow) => {
		setReapplyRow(row);
		setReapplyOpen(true);
	};

	const handleReapplySuccess = () => {
		void fetchMaterials(UPLOAD_CENTER_TABS[activeTab].value, page, pageSize);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<>
			<Button
				type="text"
				className="flex items-center gap-1 px-2"
				icon={<Icon icon="line-md:upload" />}
				onClick={handleOpen}
			>
				Upload Center
			</Button>

			<Modal
				title="Upload Center"
				open={open}
				onCancel={handleClose}
				width={"50%"}
				style={{ top: "5vh" }}
				destroyOnHidden
				footer={[
					<Button key="cancel" onClick={handleClose}>
						Cancel
					</Button>,
					<Button key="ok" type="primary" onClick={handleClose}>
						OK
					</Button>,
				]}
			>
				<div className="mb-5">
					<AppTabs items={[...UPLOAD_CENTER_TABS]} active={activeTab} onChange={handleTabChange} />
				</div>

				<div className="flex flex-col" style={{ height: "60vh" }}>
					<div className="relative flex-1 min-h-0">
						<div className="h-full overflow-y-auto pr-3">
							{materialList.length > 0 ? (
								<div className="flex flex-col gap-5">
									{materialList.map((item) => {
										const { text, color } = getDisplayStatus(item.status ?? "", item.tagSource, item.aiTagStatus);
										return (
											<div
												key={item.id}
												className="relative flex justify-between rounded-md p-2.5"
												style={{ backgroundColor: "var(--app-view-bg, #f5f5f5)" }}
											>
												<div className="w-[calc(100%-190px)]">
													<VideoInfo row={item} fileHost={fileHost} isShowReason />
												</div>
												<div className="w-[160px] shrink-0">
													<div
														className="absolute right-0 top-0 flex h-[33px] items-center justify-center gap-1.5 rounded-tr-md rounded-bl-md px-2 text-xs"
														style={{ backgroundColor: "rgb(0 0 0 / 60%)" }}
													>
														<span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
														<span className="text-white">{text}</span>
													</div>
													<div className="flex h-full flex-col items-end justify-end">
														{item.status === "re_review_rejected" && (
															<Button size="small" onClick={() => handleReapply(item)}>
																Reapply
															</Button>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<Empty description="No data" className="py-12" />
							)}
						</div>
						{loading && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
								<Spin spinning />
							</div>
						)}
					</div>

					<div className="mt-3 flex shrink-0 items-center justify-between border-t pt-3">
						<span className="text-xs text-[#8c8c8c]">{total} total</span>
						<Pagination
							size="small"
							current={page}
							pageSize={pageSize}
							total={total}
							showSizeChanger
							showQuickJumper={false}
							pageSizeOptions={[10, 20, 50]}
							onChange={handlePageChange}
						/>
					</div>
				</div>
			</Modal>

			<MaterialTagEditModal
				open={reapplyOpen}
				mode="reapply"
				row={reapplyRow}
				fileHost={fileHost}
				onClose={() => setReapplyOpen(false)}
				onSuccess={handleReapplySuccess}
			/>
		</>
	);
}
