import { Button, Empty, Modal, Pagination, Spin } from "antd";
import { useCallback, useState } from "react";
import materialService from "@/api/material/materialService";
import type { MaterialRow } from "@/api/material/types";
import { Icon } from "@/components/icon";
import { VideoInfo } from "@/components/VideoInfo";
import { useRequestFileHost } from "@/store/appStore";

const DEFAULT_PAGE_SIZE = 20;

export function DownloadCenter() {
	const fileHost = useRequestFileHost();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [fileList, setFileList] = useState<MaterialRow[]>([]);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [total, setTotal] = useState(0);

	const fetchDownloadList = useCallback(async (currentPage: number, currentPageSize: number) => {
		setLoading(true);
		try {
			const res = await materialService.getDownloadList({
				status: "success",
				page: currentPage,
				pageSize: currentPageSize,
			});
			setFileList(res.list ?? []);
			setTotal(res.total ?? 0);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleOpen = () => {
		setOpen(true);
		void fetchDownloadList(1, pageSize);
	};

	const handlePageChange = (newPage: number, newPageSize: number) => {
		setPage(newPage);
		setPageSize(newPageSize);
		void fetchDownloadList(newPage, newPageSize);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<>
			<Button
				type="text"
				className="flex items-center gap-1 px-2"
				icon={<Icon icon="line-md:download" />}
				onClick={handleOpen}
			>
				下载中心
			</Button>

			<Modal
				title="下载中心"
				open={open}
				onCancel={handleClose}
				width={"50%"}
				style={{ top: "5vh" }}
				destroyOnHidden
				footer={[
					<Button key="cancel" onClick={handleClose}>
						取消
					</Button>,
					<Button key="ok" type="primary" onClick={handleClose}>
						确认
					</Button>,
				]}
			>
				<div className="flex flex-col" style={{ height: "60vh" }}>
					<div className="relative flex-1 min-h-0">
						<div className="h-full overflow-y-auto pr-3">
							{fileList.length > 0 ? (
								<div className="flex flex-col gap-5">
									{fileList.map((item, index) => (
										<div
											key={`${item.id}-${index}`}
											className="relative rounded-md p-2.5"
											style={{ backgroundColor: "var(--app-view-bg, #f5f5f5)" }}
										>
											<VideoInfo row={item} fileHost={fileHost} />
										</div>
									))}
								</div>
							) : (
								<Empty description="暂无数据" className="py-12" />
							)}
						</div>
						{loading && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
								<Spin spinning />
							</div>
						)}
					</div>

					<div className="mt-3 flex shrink-0 items-center justify-between border-t pt-3">
						<span className="text-xs text-[#8c8c8c]">共 {total} 条</span>
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
		</>
	);
}
