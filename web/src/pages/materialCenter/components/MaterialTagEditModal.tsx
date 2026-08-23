import { useQuery } from "@tanstack/react-query";
import { Button, Cascader, DatePicker, Form, Input, Modal, message, Select } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import materialService from "@/api/material/materialService";
import { getTagListApi } from "@/api/material/tagService";
import type { MaterialRow } from "@/api/material/types";
import { SCOPE_TYPE_OPTIONS } from "@/pages/tagManagement/types";
import { MaterialVideoPreviewCard } from "@/components/MaterialVideoPreviewCard";
import { VideoPlayModal } from "@/components/VideoPlayModal";
import { type CarModelCascaderOption, toModelCascaderOptions } from "@/pages/materialCenter/shared";

export type MaterialEditMode = "edit" | "supplement" | "reapply" | "correct" | "batchEdit" | "batchSupplement";

type MaterialFormValues = {
	name?: string;
	photographer?: string;
	shootDate?: dayjs.Dayjs;
	brandId?: number;
	vehicleBrandServiceModelId?: number[];
	quality?: 0 | 1 | 2;
	typeNameList?: Array<number | string>;
	tagSelections?: Record<string, number | undefined>;
};

const TITLE_MAP: Record<MaterialEditMode, string> = {
	edit: "编辑素材基本信息",
	supplement: "补充素材标签",
	reapply: "补充素材标签",
	correct: "修正素材基本信息",
	batchEdit: "批量编辑素材基本信息",
	batchSupplement: "批量补充素材标签",
};

const SUCCESS_TEXT_MAP: Record<MaterialEditMode, string> = {
	edit: "编辑成功",
	supplement: "补充标签成功",
	reapply: "重新申请成功",
	correct: "修正成功",
	batchEdit: "批量编辑成功",
	batchSupplement: "批量补充标签成功",
};

const QUALITY_OPTIONS = [
	{ label: "暂不标记", value: 0 },
	{ label: "劣质素材", value: 1 },
	{ label: "优质素材", value: 2 },
] as const;
const TAG_LIST_PAGE_SIZE = 1000;

function splitVideoTitle(name: string | undefined): { baseName: string; extension: string } {
	if (!name) return { baseName: "", extension: "" };
	const trimmedName = name.trim();
	const extensionIndex = trimmedName.lastIndexOf(".");
	if (extensionIndex <= 0 || extensionIndex === trimmedName.length - 1) {
		return { baseName: trimmedName, extension: "" };
	}
	return {
		baseName: trimmedName.slice(0, extensionIndex),
		extension: trimmedName.slice(extensionIndex),
	};
}

function mergeVideoTitle(baseName: string | undefined, extension: string): string | undefined {
	const trimmedBaseName = baseName?.trim();
	if (!trimmedBaseName) return undefined;
	return `${trimmedBaseName}${extension}`;
}

function isSameTagId(left: string | number | undefined, right: string | number | undefined): boolean {
	if (left == null || right == null) return false;
	return String(left) === String(right);
}

function convertTypeNames(typeList: Array<number | string> | undefined, nameMap: Map<number, string>): string[] {
	if (!typeList || typeList.length === 0) return [];
	const names = typeList
		.map((item) => {
			const name = nameMap.get(item as number);
			if (name !== undefined) return name || String(item).trim();
			return String(item).trim();
		})
		.filter((item) => item !== "");
	return [...new Set(names)];
}

type MaterialTagEditModalProps = {
	open: boolean;
	mode: MaterialEditMode;
	row?: MaterialRow | null;
	rows?: MaterialRow[];
	fileHost: string;
	onClose: () => void;
	onSuccess: () => void;
};

export function MaterialTagEditModal({
	open,
	mode,
	row,
	rows = [],
	fileHost,
	onClose,
	onSuccess,
}: MaterialTagEditModalProps) {
	const [form] = Form.useForm<MaterialFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const [modelOptions, setModelOptions] = useState<CarModelCascaderOption[]>([]);
	const [playState, setPlayState] = useState<{ url: string; title: string } | null>(null);
	const [videoTitleExtension, setVideoTitleExtension] = useState("");
	const isBatchMode = mode === "batchEdit" || mode === "batchSupplement";
	const showBasicForm = mode !== "batchSupplement";
	const showVideoTitle = mode !== "batchEdit" && mode !== "batchSupplement";
	const showDynamicTags =
		mode === "supplement" || mode === "reapply" || mode === "correct" || mode === "batchSupplement";
	const requireBasicFields = !isBatchMode || mode === "batchEdit";

	const { data: brands = [] } = useQuery({
		queryKey: ["material-brand-list"],
		queryFn: () => materialService.getBrandList(),
		enabled: open && showBasicForm,
	});
	const { data: photographers = [] } = useQuery({
		queryKey: ["material-photographers"],
		queryFn: () => materialService.getPhotographers(),
		enabled: open && showBasicForm,
	});
	const { data: allMaterialTypes = [] } = useQuery({
		queryKey: ["material-type-list-all"],
		queryFn: () => materialService.getAllTypeList(),
		enabled: open && showBasicForm,
	});
	const { data: tagListRes } = useQuery({
		queryKey: ["material-tag-list", { pageSize: TAG_LIST_PAGE_SIZE }],
		queryFn: () => getTagListApi({ pageSize: TAG_LIST_PAGE_SIZE }),
		enabled: open && showDynamicTags,
	});

	const tagCategories = tagListRes?.list ?? [];

	const tagCategoriesByScope = useMemo(() => {
		const defaultScope = SCOPE_TYPE_OPTIONS[0].value;
		return SCOPE_TYPE_OPTIONS.map((opt) => ({
			scopeLabel: opt.label,
			scopeValue: opt.value,
			categories: tagCategories.filter((c) => (c.scopeType ?? defaultScope) === opt.value),
		}));
	}, [tagCategories]);

	const brandOptions = useMemo(() => brands.map((item) => ({ label: item.brandName, value: item.brandId })), [brands]);
	const photographerOptions = useMemo(
		() => photographers.map((item) => ({ label: item, value: item })),
		[photographers],
	);
	const materialTypeOptions = useMemo(
		() => allMaterialTypes.map((item) => ({ label: item.typeName, value: item.id })),
		[allMaterialTypes],
	);
	const materialTypeNameMap = useMemo(
		() => new Map(allMaterialTypes.map((item) => [item.id, item.typeName])),
		[allMaterialTypes],
	);

	const loadBrandModels = useCallback(async (brandId: number) => {
		const models = await materialService.getCarModelListByBrand(brandId);
		setModelOptions(toModelCascaderOptions(models));
	}, []);

	useEffect(() => {
		if (!open) return;
		if (isBatchMode || !row) {
			form.resetFields();
			setModelOptions([]);
			setVideoTitleExtension("");
			if (mode === "batchEdit") {
				form.setFieldsValue({ quality: 0 });
			}
			return;
		}

		const init = async () => {
			const carInfo = row.carModelInfo;
			const { baseName, extension } = splitVideoTitle(row.name);
			const vehicleModelPath = [carInfo?.subBrandId, carInfo?.seriesId, carInfo?.carId].filter((item): item is number =>
				Boolean(item),
			);
			if (row.brandId) {
				await loadBrandModels(row.brandId);
			} else {
				setModelOptions([]);
			}
			setVideoTitleExtension(extension);
			form.setFieldsValue({
				name: baseName,
				photographer: row.photographer,
				shootDate: row.shootTime ? dayjs(row.shootTime) : undefined,
				brandId: row.brandId,
				vehicleBrandServiceModelId: vehicleModelPath.length > 0 ? vehicleModelPath : undefined,
				quality: row.quality ?? 0,
				typeNameList: row.currentTypes?.map((item) => item.id) ?? [],
			});
		};
		void init();
	}, [form, isBatchMode, loadBrandModels, mode, open, row]);

	useEffect(() => {
		if (!open || !showDynamicTags) return;

		if (isBatchMode || !row || tagCategories.length === 0) {
			form.setFieldValue("tagSelections", {});
			return;
		}

		const selections: Record<string, number> = {};
		for (const category of tagCategories) {
			const matchedSubTag = (category.subTags ?? []).find((subTag) =>
				row.currentTags?.some((tag) => isSameTagId(subTag.id, tag.id)),
			);
			if (matchedSubTag?.id != null) {
				selections[String(category.id)] = matchedSubTag.id;
			}
		}
		form.setFieldValue("tagSelections", selections);
	}, [form, isBatchMode, open, row, showDynamicTags, tagCategories]);

	const disabledDate = useCallback(
		(currentDate: dayjs.Dayjs) => currentDate.endOf("day").isAfter(dayjs().endOf("day")),
		[],
	);

	const submit = useCallback(async () => {
		if (showDynamicTags && tagCategories.length === 0) {
			message.warning("当前没有标签，请先在标签管理中维护标签。");
			return;
		}

		const values = await form.validateFields();
		const tagSelections = values.tagSelections ?? {};
		const tagIds = Object.values(tagSelections).filter((item): item is number => typeof item === "number");
		if (showDynamicTags) {
			for (const category of tagCategories) {
				if (!category.required) continue;
				if (!tagSelections[String(category.id)]) {
					message.warning(`请选择${category.name}标签`);
					return;
				}
			}
		}

		const typeNameList = convertTypeNames(values.typeNameList, materialTypeNameMap);
		const basicPayload = {
			name: showVideoTitle ? mergeVideoTitle(values.name, videoTitleExtension) : values.name?.trim(),
			photographer: values.photographer,
			shootDate: values.shootDate ? values.shootDate.format("YYYY-MM-DD") : undefined,
			brandId: values.brandId,
			vehicleBrandServiceModelId: values.vehicleBrandServiceModelId,
			quality: values.quality,
			typeNameList,
		};
		const payloadWithDefinedValues = Object.fromEntries(
			Object.entries(basicPayload).filter(([, value]) => {
				if (value == null) return false;
				if (Array.isArray(value)) return value.length > 0;
				if (typeof value === "string") return value.trim() !== "";
				return true;
			}),
		);

		setSubmitting(true);
		try {
			if (mode === "edit") {
				if (!row) return;
				await materialService.editMaterial({
					id: row.id,
					...basicPayload,
				});
			} else if (mode === "correct") {
				if (!row) return;
				await materialService.editMaterial({
					id: row.id,
					...basicPayload,
					tagIds,
				});
			} else if (mode === "batchEdit") {
				const vehiclePath = values.vehicleBrandServiceModelId ?? [];
				const batchEditRequest: Record<string, unknown> = { ...payloadWithDefinedValues };
				if (vehiclePath.length >= 3) batchEditRequest.vehicleModelId = vehiclePath[2];
				if (vehiclePath.length >= 4) batchEditRequest.vehicleServiceId = vehiclePath[3];
				await materialService.batchEditMaterial({
					ids: rows.map((item) => item.id),
					request: batchEditRequest,
				});
			} else if (mode === "batchSupplement") {
				await materialService.batchSupplementMaterial({
					ids: rows.map((item) => item.id),
					tagIds,
				});
			} else {
				if (!row) return;
				await materialService.supplementMaterial({
					id: row.id,
					...basicPayload,
					tagIds,
				});
			}

			message.success(SUCCESS_TEXT_MAP[mode]);
			onSuccess();
			onClose();
		} finally {
			setSubmitting(false);
		}
	}, [
		form,
		materialTypeNameMap,
		mode,
		onClose,
		onSuccess,
		row,
		rows,
		showDynamicTags,
		showVideoTitle,
		tagCategories,
		videoTitleExtension,
	]);

	const handleCancelWithConfirm = useCallback(() => {
		Modal.confirm({
			title: "提示",
			content: "确认取消吗?",
			okText: "确定",
			cancelText: "取消",
			centered: true,
			onOk: onClose,
		});
	}, [onClose]);

	const handleSubmitWithConfirm = useCallback(() => {
		void form
			.validateFields()
			.then(() => {
				Modal.confirm({
					title: "提示",
					content: "确认保存提交吗?",
					okText: "确定",
					cancelText: "取消",
					centered: true,
					onOk: () => submit(),
				});
			})
			.catch(() => undefined);
	}, [form, submit]);

	return (
		<Modal
			title={TITLE_MAP[mode]}
			open={open}
			onCancel={handleCancelWithConfirm}
			maskClosable={false}
			destroyOnHidden
			width={760}
			footer={[
				<Button key="cancel" onClick={handleCancelWithConfirm}>
					取消
				</Button>,
				<Button key="submit" type="primary" loading={submitting} onClick={handleSubmitWithConfirm}>
					提交
				</Button>,
			]}
		>
			<div className="max-h-[70vh] overflow-y-auto pr-1">
				{!isBatchMode && row && (
					<div className="mb-5 flex justify-center rounded-lg bg-muted/40 p-4">
						<MaterialVideoPreviewCard
							row={row}
							fileHost={fileHost}
							width={180}
							height={240}
							borderRadius={8}
							onPlay={({ url, title }) => setPlayState({ url, title })}
						/>
					</div>
				)}

				<Form form={form} layout="vertical" className="grid grid-cols-2 gap-x-4 gap-y-3">
					{showDynamicTags && (
						<div className="col-span-2">
							<h3 className="mb-3 text-3.5 font-semibold">补充标签信息</h3>
							{tagCategoriesByScope.map(
								({ scopeValue, scopeLabel, categories }) =>
									categories.length > 0 && (
										<div key={scopeValue} className="mb-4 last:mb-0">
											<h4 className="text-3.5 font-medium text-red-500">{scopeLabel}类标签:</h4>
											<hr className="mb-2" />
											<div className="grid grid-cols-2 gap-3">
												{categories.map((category) => (
													<Form.Item
														key={category.id}
														name={["tagSelections", String(category.id)]}
														label={category.name}
														rules={
															category.required
																? [{ required: true, message: `请选择${category.name}标签` }]
																: undefined
														}
													>
														<Select
															placeholder={`请选择${category.name}标签`}
															allowClear={!category.required}
															options={(category.subTags ?? []).map((tag) => ({
																label: tag.name,
																value: tag.id,
															}))}
														/>
													</Form.Item>
												))}
											</div>
										</div>
									),
							)}
						</div>
					)}

					{showBasicForm && (
						<>
							<div className="col-span-2">
								<h3 className="mb-3 text-sm font-semibold">基础信息</h3>
							</div>

							<Form.Item
								label="品牌"
								name="brandId"
								rules={requireBasicFields ? [{ required: true, message: "请选择品牌" }] : undefined}
							>
								<Select
									placeholder="请选择品牌"
									options={brandOptions}
									allowClear={!requireBasicFields}
									onChange={(brandId) => {
										form.setFieldValue("vehicleBrandServiceModelId", undefined);
										if (typeof brandId === "number") {
											void loadBrandModels(brandId);
										} else {
											setModelOptions([]);
										}
									}}
								/>
							</Form.Item>

							<Form.Item
								label="车系/车型"
								name="vehicleBrandServiceModelId"
								rules={
									requireBasicFields
										? [
												{ required: true, message: "请选择车系/车型" },
												{
													validator(_, value: number[] | undefined) {
														if (!value?.length) return Promise.resolve();
														if (value.length >= 2) return Promise.resolve();
														const node = modelOptions.find((o) => o.value === value[0]);
														if (node?.children?.length) {
															return Promise.reject(new Error("请至少选到车系"));
														}
														return Promise.resolve();
													},
												},
											]
										: undefined
								}
							>
								<Cascader placeholder="请先选择品牌" options={modelOptions} changeOnSelect allowClear />
							</Form.Item>

							{showVideoTitle && (
								<Form.Item>
									<div className="flex justify-between items-center gap-1">
										<div className="flex-1">
											<Form.Item
												label="视频标题"
												name="name"
												rules={requireBasicFields ? [{ required: true, message: "请输入视频标题" }] : undefined}
											>
												<Input placeholder="请输入视频标题" maxLength={120} />
											</Form.Item>
										</div>
										<div className="w-10 pt-6">
											<Form.Item>
												{videoTitleExtension && (
													<span className="shrink-0 text-3.5 text-muted-foreground">{videoTitleExtension}</span>
												)}
											</Form.Item>
										</div>
									</div>
								</Form.Item>
							)}

							<Form.Item label="素材评定" name="quality">
								<Select placeholder="请选择素材评定" options={[...QUALITY_OPTIONS]} />
							</Form.Item>

							<Form.Item
								label="拍摄人"
								name="photographer"
								rules={requireBasicFields ? [{ required: true, message: "请选择拍摄人" }] : undefined}
							>
								<Select
									showSearch
									placeholder="请选择拍摄人"
									options={photographerOptions}
									allowClear={!requireBasicFields}
								/>
							</Form.Item>

							<Form.Item
								label="拍摄日期"
								name="shootDate"
								rules={requireBasicFields ? [{ required: true, message: "请选择拍摄日期" }] : undefined}
							>
								<DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={disabledDate} />
							</Form.Item>

							<Form.Item
								label="自定义分类"
								name="typeNameList"
								className="col-span-2"
								normalize={(values: Array<number | string>) => {
									const optionValueSet = new Set(materialTypeOptions.map((opt) => opt.value));
									const normalized = values.map((v) => {
										// 已是合法 option ID，直接保留，不做 label 匹配
										if (optionValueSet.has(v as number)) return v;
										// 用户手动输入的字符串，尝试 label 精确匹配
										if (typeof v === "string") {
											const match = materialTypeOptions.find((opt) => opt.label === v.trim());
											return match ? match.value : v;
										}
										return v;
									});
									return [...new Set(normalized)];
								}}
							>
								<Select
									mode="tags"
									placeholder="请选择或输入自定义分类"
									options={materialTypeOptions}
									showSearch={{ optionFilterProp: "label" }}
									tokenSeparators={[","]}
									maxTagCount="responsive"
								/>
							</Form.Item>
						</>
					)}
				</Form>
			</div>
			<VideoPlayModal
				open={playState !== null}
				onClose={() => setPlayState(null)}
				url={playState?.url ?? ""}
				title={playState?.title ?? "视频预览"}
			/>
		</Modal>
	);
}
