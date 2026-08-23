import { useQuery } from "@tanstack/react-query";
import { FileModuleCode, uploadService } from "@/api/upload";
import materialService from "@/api/material/materialService";
import { Icon } from "@/components/icon";
import type { UploadFile, UploadProps } from "antd";
import { Cascader, DatePicker, Form, Select, Upload, message } from "antd";
import type { RcFile } from "antd/es/upload";
import SparkMD5 from "spark-md5";
import dayjs from "dayjs";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
	MATERIAL_REFERENCE_QUERY_OPTIONS,
	getRequestErrorMessage,
	toModelCascaderOptions,
	type CarModelCascaderOption,
} from "@/pages/materialCenter/shared";
import { AppFileList, type UploadTabKey, type UploadTask } from "./AppFileList";

const { Dragger } = Upload;

type UploadFormValues = {
	brand_id?: number;
	vehicle_brand_service_model_id?: number[];
	photographer?: string;
	shoot_date?: dayjs.Dayjs;
	type_name_list?: Array<number | string>;
};

type UploadChangeOption = Parameters<NonNullable<UploadProps["onChange"]>>[0];

type UploadTaskState = {
	uid: string;
	file: File;
	name: string;
	sizeText: string;
	status: "pending" | "uploading" | "paused" | "success" | "error";
	percent: number;
	speedText: string;
	uploadedSizeText: string;
	preview?: string;
	abortController?: AbortController;
	lastLoadedBytes: number;
	lastTime: number;
	errorMessage?: string;
	id: string | number;
	url: string;
	originalFileName: string;
	storageKey: string;
	md5: string;
	isSubmitted?: boolean;
	submitStatus?: "idle" | "submitting" | "error";
};

export type UploadSubmitResult = {
	proceeded: boolean;
	successCount: number;
	failedCount: number;
	allSucceeded: boolean;
};

export type AppDyUploadHandle = {
	submit: () => Promise<UploadSubmitResult>;
	hasUploadedFiles: () => boolean;
};

export type AppDyUploadProps = {
	id?: number;
	isReUpload?: boolean;
	manualSave?: boolean;
};

function formatSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function isAntdFormValidationError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "errorFields" in error;
}

async function computeFileMD5(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunkSize = 10 * 1024 * 1024;
		const spark = new SparkMD5.ArrayBuffer();
		const reader = new FileReader();
		let cursor = 0;

		const loadNext = () => {
			const slice = file.slice(cursor, cursor + chunkSize);
			reader.readAsArrayBuffer(slice);
		};

		reader.onload = (event) => {
			if (!event.target?.result) {
				reject(new Error("读取文件失败"));
				return;
			}
			spark.append(event.target.result as ArrayBuffer);
			cursor += chunkSize;
			if (cursor < file.size) loadNext();
			else resolve(spark.end());
		};
		reader.onerror = () => reject(new Error("读取文件失败"));
		loadNext();
	});
}

function AppDyUploadInner(
	{ id = 0, isReUpload = false, manualSave = true }: AppDyUploadProps,
	ref: React.Ref<AppDyUploadHandle>,
) {
	const [form] = Form.useForm<UploadFormValues>();
	const [tasks, setTasks] = useState<UploadTaskState[]>([]);
	const [modelOptions, setModelOptions] = useState<CarModelCascaderOption[]>([]);
	const [activeTab, setActiveTab] = useState<UploadTabKey>("all");
	const tasksRef = useRef<UploadTaskState[]>([]);
	const startingTaskUidRef = useRef<string | null>(null);
	const resetScopeRef = useRef<{ id: number; isReUpload: boolean } | null>(null);
	const previewUrlMapRef = useRef<Map<string, string>>(new Map());

	const updateTasks = useCallback((updater: (prev: UploadTaskState[]) => UploadTaskState[]) => {
		setTasks((prev) => {
			const next = updater(prev);
			tasksRef.current = next;
			return next;
		});
	}, []);

	const { data: brands = [] } = useQuery({
		queryKey: ["material-brand-list"],
		queryFn: () => materialService.getBrandList(),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});
	const { data: photographers = [] } = useQuery({
		queryKey: ["material-photographers"],
		queryFn: () => materialService.getPhotographers(),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});
	const { data: materialTypes = [] } = useQuery({
		queryKey: ["material-upload-type-list"],
		queryFn: () => materialService.getMaterialTypeList(),
		...MATERIAL_REFERENCE_QUERY_OPTIONS,
	});

	const brandOptions = useMemo(() => brands.map((item) => ({ label: item.brandName, value: item.brandId })), [brands]);
	const photographerOptions = useMemo(
		() => photographers.map((item) => ({ label: item, value: item })),
		[photographers],
	);
	const customCategoryOptions = useMemo(
		() =>
			materialTypes.map((item) => ({
				label: item.typeName ?? item.name ?? "",
				value: item.id,
			})),
		[materialTypes],
	);
	const customCategoryNameMap = useMemo(
		() => new Map(materialTypes.map((item) => [item.id, item.typeName ?? item.name ?? ""])),
		[materialTypes],
	);

	const normalizeTypeNameList = useCallback(
		(typeList: Array<number | string> | undefined) => {
			if (!typeList || typeList.length === 0) return [] as string[];
			const names = typeList
				.map((item) => {
					// 同时兼容 string/number id，运行时 Map.get 使用严格相等
					const name = customCategoryNameMap.get(item as number);
					if (name !== undefined) return name || String(item).trim();
					// 不在 Map 中 → 用户自定义输入，原样提交
					return String(item).trim();
				})
				.filter((item) => item !== "");
			return [...new Set(names)];
		},
		[customCategoryNameMap],
	);

	const loadBrandModels = useCallback(async (brandId: number) => {
		const models = await materialService.getCarModelListByBrand(brandId);
		setModelOptions(toModelCascaderOptions(models));
	}, []);

	// Stable: reads tasksRef.current, no tasks dep
	const hasUploadedFiles = useCallback(() => tasksRef.current.length > 0, []);

	const setTaskPatch = useCallback(
		(uid: string, patch: Partial<UploadTaskState>) => {
			updateTasks((prev) => prev.map((item) => (item.uid === uid ? { ...item, ...patch } : item)));
		},
		[updateTasks],
	);

	const removeTaskByUid = useCallback(
		(uid: string) => {
			const preview = previewUrlMapRef.current.get(uid);
			if (preview) {
				URL.revokeObjectURL(preview);
				previewUrlMapRef.current.delete(uid);
			}
			updateTasks((prev) => prev.filter((item) => item.uid !== uid));
		},
		[updateTasks],
	);

	// Stable: reads tasksRef.current, no tasks dep
	const saveUploadedTasks = useCallback(
		async (withValidation: boolean) => {
			let values: UploadFormValues;
			if (withValidation) {
				values = await form.validateFields();
			} else {
				values = form.getFieldsValue();
			}

			if (tasksRef.current.some((t) => t.status === "uploading")) {
				message.warning("请等待所有文件上传完成");
				return {
					proceeded: false,
					successCount: 0,
					failedCount: 0,
					allSucceeded: false,
				} satisfies UploadSubmitResult;
			}

			const tasksToSave = tasksRef.current.filter((item) => item.status === "success" && !item.isSubmitted);
			if (tasksToSave.length === 0) {
				return {
					proceeded: true,
					successCount: 0,
					failedCount: 0,
					allSucceeded: true,
				} satisfies UploadSubmitResult;
			}

			const vehicleBrandServiceModelPath = values.vehicle_brand_service_model_id ?? [];
			const normalizedTypeNameList = normalizeTypeNameList(values.type_name_list);
			const commonFields = {
				brandId: values.brand_id,
				vehicleModelId: vehicleBrandServiceModelPath.length >= 3 ? vehicleBrandServiceModelPath[2] : undefined,
				vehicleServiceId: vehicleBrandServiceModelPath.length >= 4 ? vehicleBrandServiceModelPath[3] : undefined,
				vehicleBrandServiceModelId: vehicleBrandServiceModelPath.length > 0 ? vehicleBrandServiceModelPath : undefined,
				photographer: values.photographer,
				shootDate: values.shoot_date ? values.shoot_date.format("YYYY-MM-DD") : undefined,
				typeNameList: normalizedTypeNameList.length > 0 ? normalizedTypeNameList : undefined,
			};

			const taskUidSet = new Set(tasksToSave.map((task) => task.uid));
			updateTasks((prev) =>
				prev.map((item) =>
					taskUidSet.has(item.uid)
						? {
								...item,
								submitStatus: "submitting",
								errorMessage: undefined,
								speedText: "素材创建中...",
							}
						: item,
				),
			);

			const results = await Promise.all(
				tasksToSave.map(async (task) => {
					const payload = {
						name: task.originalFileName,
						md5: task.md5,
						storageKey: task.storageKey,
						...commonFields,
					};
					try {
						if (isReUpload) {
							await materialService.reUploadMaterial({ id, ...payload });
						} else {
							await materialService.uploadMaterial(payload);
						}
						removeTaskByUid(task.uid);
						return { success: true } as const;
					} catch (error) {
						setTaskPatch(task.uid, {
							isSubmitted: false,
							submitStatus: "error",
							errorMessage: getRequestErrorMessage(error, "素材创建失败"),
							speedText: "素材创建失败",
						});
						return { success: false } as const;
					}
				}),
			);

			const successCount = results.filter((item) => item.success).length;
			const failedCount = results.length - successCount;
			return {
				proceeded: true,
				successCount,
				failedCount,
				allSucceeded: failedCount === 0,
			} satisfies UploadSubmitResult;
		},
		[form, id, isReUpload, normalizeTypeNameList, removeTaskByUid, setTaskPatch, updateTasks],
	);

	// Stable: reads tasksRef.current, no tasks dep
	const submit = useCallback(async () => {
		try {
			const hasPausedTask = tasksRef.current.some((task) => task.status === "paused");
			if (hasPausedTask) {
				message.warning("存在暂停的任务，请上传完成或删除暂停的任务再点击确定按钮");
				return {
					proceeded: false,
					successCount: 0,
					failedCount: 0,
					allSucceeded: false,
				} satisfies UploadSubmitResult;
			}

			const unfinished = tasksRef.current.some((task) => task.status === "uploading" || task.status === "pending");
			if (unfinished) {
				message.warning("请等待所有文件上传完成");
				return {
					proceeded: false,
					successCount: 0,
					failedCount: 0,
					allSucceeded: false,
				} satisfies UploadSubmitResult;
			}

			return await saveUploadedTasks(true);
		} catch (error) {
			if (isAntdFormValidationError(error)) {
				return {
					proceeded: false,
					successCount: 0,
					failedCount: 0,
					allSucceeded: false,
				} satisfies UploadSubmitResult;
			}
			message.error(getRequestErrorMessage(error, "操作失败"));
			return {
				proceeded: false,
				successCount: 0,
				failedCount: 0,
				allSucceeded: false,
			} satisfies UploadSubmitResult;
		}
	}, [saveUploadedTasks]);

	const runUploadTask = useCallback(
		async (task: UploadTaskState) => {
			if (task.status !== "pending" && task.status !== "paused") return;

			const { uid } = task;
			startingTaskUidRef.current = uid;

			setTaskPatch(uid, {
				status: "uploading",
				speedText: "计算中...",
				lastLoadedBytes: 0,
				lastTime: Date.now(),
				errorMessage: undefined,
				submitStatus: "idle",
			});

			const controller = new AbortController();
			setTaskPatch(uid, { abortController: controller });

			try {
				const md5 = await computeFileMD5(task.file);
				const response = await uploadService.uploadFile({
					file: task.file,
					moduleCode: FileModuleCode.BUSINESS_DOC,
					signal: controller.signal,
					onProgress: (percent, loadedBytes = 0) => {
						updateTasks((prev) =>
							prev.map((item) => {
								if (item.uid !== uid || item.status !== "uploading") return item;
								const now = Date.now();
								const diffSeconds = Math.max((now - item.lastTime) / 1000, 0.001);
								const loadedDiff = Math.max(loadedBytes - item.lastLoadedBytes, 0);
								const speedText = loadedDiff > 0 ? `${formatSize(loadedDiff / diffSeconds)}/s` : item.speedText;
								return {
									...item,
									percent,
									uploadedSizeText: formatSize(loadedBytes),
									speedText,
									lastLoadedBytes: loadedBytes,
									lastTime: now,
								};
							}),
						);
					},
				});

				setTaskPatch(uid, {
					status: "success",
					speedText: "上传完成",
					percent: 100,
					uploadedSizeText: formatSize(task.file.size),
					id: response.id,
					url: response.url,
					originalFileName: response.originalFileName,
					storageKey: response.fileName,
					md5,
					isSubmitted: false,
					submitStatus: "idle",
					errorMessage: undefined,
				});

				if (!manualSave) {
					await saveUploadedTasks(false);
				}
			} catch (error) {
				const aborted = (error as { name?: string }).name === "CanceledError" || controller.signal.aborted;
				if (aborted) {
					updateTasks((prev) =>
						prev.map((item) =>
							item.uid === uid && item.status === "uploading" ? { ...item, status: "paused" } : item,
						),
					);
				} else {
					setTaskPatch(uid, {
						status: "error",
						speedText: "上传失败",
						errorMessage: "上传失败",
						submitStatus: "idle",
					});
				}
			} finally {
				startingTaskUidRef.current = null;
				setTaskPatch(uid, { abortController: undefined });
			}
		},
		[manualSave, saveUploadedTasks, setTaskPatch, updateTasks],
	);

	const addFiles = useCallback(
		(files: File[]) => {
			updateTasks((prev) => {
				const next = [...prev];
				for (const file of files) {
					const duplicate = next.some(
						(item) =>
							item.file.name === file.name &&
							item.file.size === file.size &&
							item.file.lastModified === file.lastModified,
					);
					if (duplicate) continue;
					const uid = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
					const preview = file.type.startsWith("video/") ? URL.createObjectURL(file) : undefined;
					if (preview) previewUrlMapRef.current.set(uid, preview);
					next.push({
						uid,
						file,
						name: file.name,
						sizeText: formatSize(file.size),
						status: "pending",
						percent: 0,
						speedText: "待上传",
						uploadedSizeText: "0 B",
						preview,
						lastLoadedBytes: 0,
						lastTime: Date.now(),
						id: "",
						url: "",
						originalFileName: file.name,
						storageKey: "",
						md5: "",
						submitStatus: "idle",
					});
				}
				return next;
			});
		},
		[updateTasks],
	);

	const handleAddChange: UploadProps["onChange"] = useCallback(
		({ file }: UploadChangeOption) => {
			if (!file.originFileObj) return;
			addFiles([file.originFileObj as File]);
		},
		[addFiles],
	);

	const beforeUpload: UploadProps["beforeUpload"] = useCallback(
		(file: RcFile) => {
			const raw = file as File;
			addFiles([raw]);
			return false;
		},
		[addFiles],
	);

	const handleRemoveTask = useCallback(
		(task: UploadTask) => {
			updateTasks((prev) => {
				const target = prev.find((item) => item.uid === task.uid);
				target?.abortController?.abort();
				return prev;
			});
			removeTaskByUid(task.uid);
		},
		[removeTaskByUid, updateTasks],
	);

	// Stable: reads tasksRef.current for hasUploading check, no tasks dep
	const handleStartTask = useCallback(
		(task: UploadTask) => {
			const fullTask = tasksRef.current.find((item) => item.uid === task.uid);
			if (!fullTask) return;

			const hasUploading = tasksRef.current.some((item) => item.status === "uploading");
			if (hasUploading || startingTaskUidRef.current) {
				message.warning("当前有文件正在上传");
				return;
			}
			void runUploadTask(fullTask);
		},
		[runUploadTask],
	);

	const handlePauseTask = useCallback(
		(task: UploadTask) => {
			updateTasks((prev) => {
				const target = prev.find((item) => item.uid === task.uid);
				if (!target) return prev;
				target.abortController?.abort();
				if (target.status !== "uploading") return prev;
				return prev.map((item) =>
					item.uid === task.uid
						? {
								...item,
								status: "paused",
								speedText: "已暂停",
							}
						: item,
				);
			});
		},
		[updateTasks],
	);

	const handleRetryTask = useCallback(
		(task: UploadTask) => {
			updateTasks((prev) =>
				prev.map((item) =>
					item.uid === task.uid
						? {
								...item,
								status: "pending",
								percent: 0,
								speedText: "待上传",
								uploadedSizeText: "0 B",
								errorMessage: undefined,
								abortController: undefined,
								isSubmitted: false,
								submitStatus: "idle",
							}
						: item,
				),
			);
		},
		[updateTasks],
	);

	const uploadTasks = useMemo<UploadTask[]>(
		() =>
			tasks.map((task) => ({
				uid: task.uid,
				file: task.file,
				name: task.name,
				sizeText: task.sizeText,
				status: task.status,
				percent: task.percent,
				speedText: task.speedText,
				preview: task.preview,
				uploadedSizeText: task.uploadedSizeText,
				submitStatus: task.submitStatus,
				errorMessage: task.errorMessage,
			})),
		[tasks],
	);

	// Auto-start the next queued task once no task is starting or uploading.
	useEffect(() => {
		if (startingTaskUidRef.current) return;
		const hasUploading = tasks.some((task) => task.status === "uploading");
		if (hasUploading) return;
		const pendingTask = tasks.find((task) => task.status === "pending");
		if (!pendingTask) return;
		void runUploadTask(pendingTask);
	}, [runUploadTask, tasks]);

	useEffect(() => {
		const validUids = new Set(tasks.map((task) => task.uid));
		for (const [uid, url] of previewUrlMapRef.current.entries()) {
			if (!validUids.has(uid)) {
				URL.revokeObjectURL(url);
				previewUrlMapRef.current.delete(uid);
			}
		}
	}, [tasks]);

	const disabledDate = useCallback(
		(currentDate: dayjs.Dayjs) => currentDate.valueOf() > dayjs().endOf("day").valueOf(),
		[],
	);

	useImperativeHandle(
		ref,
		() => ({
			submit,
			hasUploadedFiles,
		}),
		[hasUploadedFiles, submit],
	);

	useEffect(() => {
		const previousScope = resetScopeRef.current;
		resetScopeRef.current = { id, isReUpload };
		if (previousScope && previousScope.id === id && previousScope.isReUpload === isReUpload) return;

		for (const url of previewUrlMapRef.current.values()) {
			URL.revokeObjectURL(url);
		}
		previewUrlMapRef.current.clear();
		form.resetFields();
		for (const task of tasksRef.current) {
			task.abortController?.abort();
		}
		startingTaskUidRef.current = null;
		updateTasks(() => []);
		setModelOptions([]);
		setActiveTab("all");
	}, [form, id, isReUpload, updateTasks]);

	return (
		<div>
			<Dragger
				multiple={!isReUpload}
				accept="video/*,.mp4,.mov,.m4v,.avi,.webm"
				beforeUpload={beforeUpload}
				onChange={handleAddChange}
				fileList={[] as UploadFile[]}
				showUploadList={false}
				className="rounded-xl border border-dashed border-[#F5F5F5] bg-[#fafcff] py-8"
			>
				<div className="flex flex-col items-center gap-2">
					<Icon icon="icon-park-outline:upload" className="text-[20px] text-[#666666]" />
					<p className="text-[14px] text-[#1D2129]">点击上传视频或拖拽视频到这里</p>
				</div>
			</Dragger>

			<Form form={form} layout="vertical" className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
				<Form.Item label="品牌" name="brand_id" rules={[{ required: true, message: "请选择品牌" }]} className="mb-0">
					<Select
						placeholder="请选择品牌"
						options={brandOptions}
						allowClear
						onChange={(brandId) => {
							form.setFieldValue("vehicle_brand_service_model_id", undefined);
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
					name="vehicle_brand_service_model_id"
					rules={[
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
					]}
					className="mb-0"
				>
					<Cascader placeholder="请先选择品牌" options={modelOptions} changeOnSelect allowClear />
				</Form.Item>
				<Form.Item
					label="拍摄人"
					name="photographer"
					rules={[{ required: true, message: "请选择拍摄人" }]}
					className="mb-0"
				>
					<Select placeholder="请选择拍摄人" options={photographerOptions} allowClear showSearch />
				</Form.Item>
				<Form.Item
					label="拍摄时间"
					name="shoot_date"
					rules={[{ required: true, message: "请选择拍摄日期" }]}
					className="mb-0"
				>
					<DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={disabledDate} />
				</Form.Item>
				<Form.Item
					label="自定义分类"
					name="type_name_list"
					className="col-span-2 mb-0"
					normalize={(values: Array<number | string>) => {
						const optionValueSet = new Set(customCategoryOptions.map((opt) => opt.value));
						const normalized = values.map((v) => {
							// 已是合法 option ID，直接保留，不做 label 匹配
							if (optionValueSet.has(v as number)) return v;
							// 用户手动输入的字符串，尝试 label 精确匹配
							if (typeof v === "string") {
								const match = customCategoryOptions.find((opt) => opt.label === v.trim());
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
						options={customCategoryOptions}
						showSearch={{ optionFilterProp: "label" }}
						tokenSeparators={[","]}
						maxTagCount="responsive"
					/>
				</Form.Item>
			</Form>
			<AppFileList
				tasks={uploadTasks}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				onRemove={handleRemoveTask}
				onStart={handleStartTask}
				onPause={handlePauseTask}
				onRetry={handleRetryTask}
			/>
		</div>
	);
}

export const AppDyUpload = forwardRef<AppDyUploadHandle, AppDyUploadProps>(AppDyUploadInner);
