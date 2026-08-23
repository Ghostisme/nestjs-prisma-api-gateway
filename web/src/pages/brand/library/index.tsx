import { Button, message, Space } from "antd";
// Tag
import { useCallback, useMemo, useRef, useState } from "react";
import {
	// postWxBrandPageApi,
	delBrand,
	// postBrandExportBrandInfoApi,
	postBrandOfflineApi,
	postBrandPageApi,
} from "@/api/brand/library";
// import type { BrandRow } from "./types";
import type { BrandInfo } from "@/api/brand/types";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthCheck } from "@/components/auth/use-auth";
import { Icon } from "@/components/icon";
import type { TableAction, TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { useRequestFileHost } from "@/store/appStore";
import { buildMaterialFileUrl } from "@/utils/materialFileUrl";
import { tableCfg } from "../utils";
// import { uploadService } from "@/api/upload";
// import { exportDownload, tableCfg } from "../utils";
// import { BrandCard } from "./components/brand-card";
import { BrandDetailModal } from "./components/brand-detail-modal";
import { BrandRegionModal } from "./components/brand-region-modal";
import { CreateFormModal } from "./components/create-form-modal";
import DeleteConfirmModal from "./components/delete-confirm-modal";
import { OfflineConfirmModal } from "./components/offline-confirm-modal";
import { OperationLogModal } from "./components/operation-log-modal";

export default function LibraryPage() {
	const actionRef = useRef<TableAction | null>(null);
	const fileHost = useRequestFileHost();
	const { check } = useAuthCheck("permission");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalType, setModalType] = useState<"create" | "edit">("create");
	const [isBrandDetailModal, setIsBrandDetailModal] = useState(false);
	const [isLogModalOpen, setIsLogModalOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<BrandInfo>();
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [offlineModalOpen, setOfflineModalOpen] = useState(false);
	const [offlineLoading, setOfflineLoading] = useState(false);
	const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
	// const [selectedBrandId, setSelectedBrandId] = useState<number>();
	const [selectedBrandId, _] = useState<number>();

	const handleView = useCallback((item: BrandInfo) => {
		setSelectedItem(item);
		setIsBrandDetailModal(true);
	}, []);

	const handleEdit = useCallback((item: BrandInfo) => {
		setSelectedItem(item);
		setModalType("edit");
		setIsModalOpen(true);
	}, []);

	const handleDel = useCallback((item: BrandInfo) => {
		setSelectedItem(item);
		setDeleteModalOpen(true);
	}, []);

	// const handleRecord = useCallback((item: BrandInfo) => {
	//   setSelectedItem(item);
	//   setIsLogModalOpen(true);
	// }, []);

	const handleOfflineClick = useCallback((item: BrandInfo) => {
		setSelectedItem(item);
		setOfflineModalOpen(true);
	}, []);

	// const handleRegionClick = useCallback((brandId: number) => {
	//   setSelectedBrandId(brandId);
	//   setIsRegionModalOpen(true);
	// }, []);

	const handleCreate = useCallback(() => {
		setModalType("create");
		setSelectedItem(undefined);
		setIsModalOpen(true);
	}, []);

	const handleOfflineConfirm = useCallback(async () => {
		if (!selectedItem) return;
		setOfflineLoading(true);
		try {
			await postBrandOfflineApi({ brandId: +selectedItem.brandId });
			message.success("下线成功");
			setOfflineModalOpen(false);
			actionRef.current?.reload({ resetPage: true });
		} catch (error) {
			console.error(error);
		} finally {
			setOfflineLoading(false);
		}
	}, [selectedItem]);

	const handleDeleteConfirm = useCallback(async () => {
		if (!selectedItem) return;
		setDeleteLoading(true);
		try {
			// await postBrandOfflineApi({ brandId: +selectedItem.brandId });
			await delBrand(+selectedItem.brandId);
			message.success("删除成功");
			setDeleteModalOpen(false);
			actionRef.current?.reload({ resetPage: true });
		} catch (error) {
			console.error(error);
			message.error(error.message);
		} finally {
			setDeleteLoading(false);
		}
	}, [selectedItem]);

	// const exportBrandModelData = useCallback(async () => {
	//   exportDownload(
	//     postBrandExportBrandInfoApi,
	//     "brand-library-management.search",
	//   );
	// }, []);

	const tableConfig = useMemo<TableConfig<BrandInfo>>(
		() => ({
			...tableCfg,
			dataSource: {
				api: (params) => {
					const { page, pageSize, ...rest } = params ?? {};
					// return postWxBrandPageApi({
					//   ...rest,
					//   page: typeof page === "number" ? page : undefined,
					//   size: typeof pageSize === "number" ? pageSize : undefined,
					// });
					return postBrandPageApi({
						...rest,
						page: typeof page === "number" ? page : undefined,
						size: typeof pageSize === "number" ? pageSize : undefined,
					});
				},
			},
			search: {
				...tableCfg.search,
				cacheKey: "brand-library-management.search",
				fields: [
					{
						name: "keyword",
						label: "品牌名称",
						type: "input",
						placeholder: "请输入品牌名称",
					},
					// {
					//     name: 'regionName',
					//     label: '所属大区',
					//     type: 'input',
					//     placeholder: '请输入所属大区'
					// },
					// {
					//     name: 'brandContact',
					//     label: '品牌对接人',
					//     type: 'input',
					//     placeholder: '请输入品牌对接人'
					// },
					// {
					//     name: 'dataSpecialist',
					//     label: '数据专员',
					//     type: 'input',
					//     placeholder: '请输入数据专员'
					// },
					// {
					//   name: "brandStatus",
					//   label: "品牌状态",
					//   type: "select",
					//   options: [
					//     { label: "已上线", value: 1 },
					//     { label: "已下线", value: 2 },
					//   ],
					// },
					// {
					//   name: "joinTime",
					//   label: "加入时间",
					//   type: "daterange",
					//   itemStyle: { gridColumn: "span 1 / span 1" },
					//   submitAs: { start: "joinStartTime", end: "joinEndTime" },

					//   props: { format: "YYYY-MM-DD HH:mm:ss", showTime: true },
					// },
				],
			},
			columns: [
				{
					title: "品牌Logo",
					dataIndex: "brandLogo",
					width: 100,
					render: (logo: string) => (
						<div className="flex items-center justify-center">
							<img
								src={buildMaterialFileUrl(fileHost, logo)}
								alt="logo"
								className="w-10 h-10 rounded-full object-cover border border-gray-200"
							/>
						</div>
					),
				},
				{ title: "品牌名称", dataIndex: "brandName", width: 150 },
				// {
				//     title: '覆盖大区数',
				//     dataIndex: 'regionCount',
				//     width: 120,
				//     render: (count, record) => (
				//         <Button
				//             type='link'
				//             onClick={() => handleRegionClick(record.brandId)}
				//             className='p-0'
				//         >
				//             {count}
				//         </Button>
				//     )
				// },
				// { title: '品牌对接人', dataIndex: 'pmoName', width: 120 },
				// { title: "数据专员", dataIndex: "specialistName", width: 120 },
				// {
				//   title: "品牌状态",
				//   dataIndex: "brandStatus",
				//   width: 100,
				//   format: "status",
				//   statusMap: {
				//     1: "已上线",
				//     2: "已下线",
				//   },
				//   // render: status => (
				//   //     <Tag color={status === 1 ? 'success' : 'error'}>
				//   //         {status === 1 ? '已上线' : '已下线'}
				//   //     </Tag>
				//   // )
				// },
				{
					title: "创建时间",
					dataIndex: "createTime",
					width: 180,
					format: "date",
				},
				{
					title: "创建人",
					dataIndex: "createUser",
					width: 180,
				},
				// {
				//   title: "更新时间",
				//   dataIndex: "updateTime",
				//   width: 180,
				//   format: "date",
				// },
				{
					title: "操作",
					key: "action",
					dataIndex: "action",
					width: 280,
					fixed: "right",
					render: (_, record) => (
						<Space>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button type="link" size="small" onClick={() => handleView(record)}>
									查看
								</Button>
							</AuthGuard>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button type="link" size="small" onClick={() => handleEdit(record)}>
									编辑
								</Button>
							</AuthGuard>
							<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
								<Button type="link" size="small" danger onClick={() => handleDel(record)}>
									删除
								</Button>
							</AuthGuard>
							{/* <Button
                type="link"
                size="small"
                onClick={() => handleRecord(record)}
              >
                操作记录
              </Button> */}
							{record.brandStatus === 1 ? (
								<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
									<Button
										type="link"
										size="small"
										className="hidden!"
										danger
										onClick={() => handleOfflineClick(record)}
									>
										确认下线
									</Button>
								</AuthGuard>
							) : null}
						</Space>
					),
				},
			],
			toolbar: {
				align: "left",
				customActions: [
					...(check(LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage)
						? [
								{
									text: "新建品牌",
									icon: <Icon icon="mingcute:add-line" />,
									type: "primary" as const,
									onClick: handleCreate,
								},
							]
						: []),
					// {
					//   text: "导出品牌基础信息",
					//   icon: <Icon icon="solar:export-linear" />,
					//   type: "default",
					//   onClick: exportBrandModelData,
					// },
				],
			},
		}),
		[
			handleView,
			handleEdit,
			handleDel,
			// handleRecord,
			handleOfflineClick,
			handleCreate,
			// exportBrandModelData,
			// handleRegionClick,
		],
	);

	return (
		<>
			<ConfigTable actionRef={actionRef} config={tableConfig} />
			<CreateFormModal
				isModalOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				type={modalType}
				initialValues={modalType === "edit" ? selectedItem : undefined}
				onSuccess={() => actionRef.current?.reload({ resetPage: true })}
			/>
			<BrandDetailModal open={isBrandDetailModal} onClose={() => setIsBrandDetailModal(false)} item={selectedItem} />
			<DeleteConfirmModal
				open={deleteModalOpen}
				onCancel={() => setDeleteModalOpen(false)}
				onConfirm={handleDeleteConfirm}
				loading={deleteLoading}
			/>
			<OperationLogModal
				open={isLogModalOpen}
				onCancel={() => setIsLogModalOpen(false)}
				brandId={selectedItem?.brandId}
			/>
			<OfflineConfirmModal
				open={offlineModalOpen}
				onCancel={() => setOfflineModalOpen(false)}
				onConfirm={handleOfflineConfirm}
				loading={offlineLoading}
			/>
			<BrandRegionModal
				open={isRegionModalOpen}
				onClose={() => setIsRegionModalOpen(false)}
				brandId={selectedBrandId}
			/>
		</>
	);
}
