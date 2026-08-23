import { Button, Avatar, Tag } from "antd";
import { Icon } from "@/components/icon";
import ConfigTable from "@/components/table";
import type { TableConfig } from "@/components/table";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { CreateBrandModel } from "./components/create-brand-model";
import { ModelListModal } from "./components/model-list-modal";
import { postBrandModelPageApi } from "@/api/brand/model";
import { postBrandGetAllBrandInfoApi } from "@/api/brand/library";
import { exportDownload, tableCfg } from "../utils";
import { postBrandModelExportApi } from "@/api/brand/model";

interface BrandModelRow {
	brandId: number;
	brandLogo: string;
	brandName: string;
	brandStatus: number; // 假设 1 为上线，0 为下线
	modelCount: number;
	updateTime: string;
}

export default function ModelPage() {
	const [createBrandModelVisible, setCreateBrandModelVisible] = useState(false);
	const [currentBrand, setCurrentBrand] = useState<BrandModelRow | null>(null);
	const tableRef = useRef<any>(null);

	// 车型列表弹窗状态
	const [modelListVisible, setModelListVisible] = useState(false);
	const [currentBrandIdForList, setCurrentBrandIdForList] = useState<number | undefined>(undefined);
	const [brandOptions, setBrandOptions] = useState<any[]>([]);

	useEffect(() => {
		postBrandGetAllBrandInfoApi().then((res: any) => {
			const data = res?.data || res;
			if (Array.isArray(data)) {
				setBrandOptions(
					data.map((item: any) => ({
						label: item.brandName,
						value: item.brandId,
					})),
				);
			}
		});
	}, []);

	const onCancel = useCallback(() => {
		setCreateBrandModelVisible(false);
		setCurrentBrand(null);
	}, []);

	const onOk = useCallback(() => {
		setCreateBrandModelVisible(false);
		setCurrentBrand(null);
		tableRef.current?.reload();
	}, []);

	const exportBrandModelData = useCallback(async () => {
		exportDownload(postBrandModelExportApi, "brand-model-management.search");
	}, []);

	const tableConfig = useMemo<TableConfig<BrandModelRow>>(
		() => ({
			...tableCfg,
			dataSource: {
				api: (params) => {
					const { page, pageSize, ...rest } = params ?? {};
					return postBrandModelPageApi({
						...rest,
						current: typeof page === "number" ? page : undefined,
						size: typeof pageSize === "number" ? pageSize : undefined,
					});
				},
			},
			columns: [
				{ title: "品牌ID", dataIndex: "brandId", width: 100 },
				{
					title: "品牌logo",
					dataIndex: "brandLogo",
					width: 100,
					render: (url: any) => <Avatar src={url} shape="square" />,
				},
				{ title: "品牌名称", dataIndex: "brandName", width: 200 },
				{
					title: "品牌状态",
					dataIndex: "brandStatus",
					width: 100,
					render: (status) => <Tag color={status === 1 ? "success" : "default"}>{status === 1 ? "上线" : "下线"}</Tag>,
				},
				{
					title: "车型数量",
					dataIndex: "modelCount",
					width: 120,
					render: (num: any, record) => (
						<Button
							type="link"
							size="small"
							onClick={() => {
								setCurrentBrandIdForList(record.brandId);
								setModelListVisible(true);
							}}
						>
							{num}
						</Button>
					),
				},
				{ title: "更新时间", dataIndex: "updateTime", width: 180 },
				{
					title: "操作",
					key: "action",
					dataIndex: "action",
					width: 150,
					fixed: "right",
					render: (_, record) => (
						<Button
							type="link"
							size="small"
							onClick={() => {
								setCurrentBrand(record);
								setCreateBrandModelVisible(true);
							}}
						>
							添加车型
						</Button>
					),
				},
			],
			search: {
				...tableCfg.search,
				cacheKey: "brand-model-management.search",
				fields: [
					{
						name: "brandId",
						label: "所属品牌",
						type: "select",
						options: brandOptions,
					},
					{
						name: "modelName",
						label: "车型名称",
						type: "input",
						placeholder: "请输入车型名称",
					},
					{
						name: "modelType",
						label: "车型类型",
						type: "select",
						options: [
							// 1-指定车型，2-全国，3-区域
							{ label: "指定车型", value: 1 },
							{ label: "全国", value: 2 },
							{ label: "区域", value: 3 },
						],
					},
					{
						name: "joinTime",
						label: "加入时间",
						type: "daterange",
						itemStyle: { gridColumn: "span 1 / span 1" },
						submitAs: { start: "joinStartTime", end: "joinEndTime" },

						props: { format: "YYYY-MM-DD HH:mm:ss", showTime: true },
					},
				],
			},
			toolbar: {
				...tableCfg.toolbar,
				customActions: [
					{
						text: "新建品牌车型",
						icon: <Icon icon="gg:add" />,
						type: "primary",
						onClick: () => {
							setCurrentBrand(null);
							setCreateBrandModelVisible(true);
						},
					},
					{
						text: "导出品牌车型数据",
						icon: <Icon icon="solar:export-linear" />,
						type: "default",
						onClick: exportBrandModelData,
					},
				],
			},
		}),
		[brandOptions, exportBrandModelData],
	);

	return (
		<>
			<ConfigTable config={tableConfig} actionRef={tableRef} />
			<CreateBrandModel
				open={createBrandModelVisible}
				onCancel={onCancel}
				onOk={onOk}
				initialValues={currentBrand ? { brandId: currentBrand.brandId } : undefined}
			/>
			<ModelListModal
				open={modelListVisible}
				onCancel={() => setModelListVisible(false)}
				brandId={currentBrandIdForList}
			/>
		</>
	);
}
