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
				{ title: "Brand ID", dataIndex: "brandId", width: 100 },
				{
					title: "Brand Logo",
					dataIndex: "brandLogo",
					width: 100,
					render: (url: any) => <Avatar src={url} shape="square" />,
				},
				{ title: "Brand Name", dataIndex: "brandName", width: 200 },
				{
					title: "Brand Status",
					dataIndex: "brandStatus",
					width: 100,
					render: (status) => <Tag color={status === 1 ? "success" : "default"}>{status === 1 ? "Online" : "Offline"}</Tag>,
				},
				{
					title: "Model Count",
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
				{ title: "Updated", dataIndex: "updateTime", width: 180 },
				{
					title: "Actions",
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
							Add Car Model
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
						label: "Brand",
						type: "select",
						options: brandOptions,
					},
					{
						name: "modelName",
						label: "Car Model Name",
						type: "input",
						placeholder: "Enter car model name",
					},
					{
						name: "modelType",
						label: "Model Type",
						type: "select",
						options: [
							// 1-指定车型，2-全国，3-区域
							{ label: "Specified Model", value: 1 },
							{ label: "National", value: 2 },
							{ label: "Regional", value: 3 },
						],
					},
					{
						name: "joinTime",
						label: "Join Time",
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
						text: "New Brand Model",
						icon: <Icon icon="gg:add" />,
						type: "primary",
						onClick: () => {
							setCurrentBrand(null);
							setCreateBrandModelVisible(true);
						},
					},
					{
						text: "Export Brand Models",
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
