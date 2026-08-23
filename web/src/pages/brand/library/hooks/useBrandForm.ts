import type { UploadFile, UploadProps } from "antd";
import { Form, message, Upload } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
// import type { RcCustomRequestOptions } from "rc-upload/lib/interface";
import { useCallback, useEffect, useState } from "react";
import {
	getSubBrandList,
	// postBrandDetailsApi,
	// postBrandSaveApi,
	// postBrandUpdateApi,
	saveBrand,
	updateBrand,
} from "@/api/brand/library";
// import type { BrandInfo } from "../types";
import type { BrandInfo } from "@/api/brand/types";
import { FileModuleCode, uploadService } from "@/api/upload";
import { useRequestFileHost } from "@/store/appStore";
import { buildMaterialFileUrl } from "@/utils/materialFileUrl";
import type { UpdateFormValues } from "../types/create-form-modal.types";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE_MB = 5;
const BYTES_PER_MB = 1024 * 1024;

interface UseBrandFormParams {
	isModalOpen: boolean;
	type: "create" | "edit";
	initialValues?: BrandInfo;
	onSuccess?: () => void;
	onClose: () => void;
}

type CustomRequestOptions = Parameters<NonNullable<UploadProps["customRequest"]>>[0];

// const parseCommunityInfos = (
//   regions: Array<{
//     regionName: string;
//     communityInfos?: Array<{ communityName: string }>;
//   }> | undefined,
// ): CommunityInfo[] => {
//   if (!regions || !Array.isArray(regions)) return [];

//   return regions.flatMap((region) => {
//     if (region.communityInfos && region.communityInfos.length > 0) {
//       return region.communityInfos.map((community) => ({
//         regionName: region.regionName,
//         community: community.communityName,
//         uid: Math.random().toString(36).slice(2),
//       }));
//     }
//     return [
//       {
//         regionName: region.regionName,
//         community: "",
//         uid: Math.random().toString(36).slice(2),
//       },
//     ];
//   });
// };

export const useBrandForm = ({ isModalOpen, type, initialValues, onSuccess, onClose }: UseBrandFormParams) => {
	const [form] = Form.useForm<UpdateFormValues>();
	const fileHost = useRequestFileHost();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFetchingDetails, setIsFetchingDetails] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [brandLogoUrl, setBrandLogoUrl] = useState<string>();

	// 关联品牌下拉选项
	const [subBrandOptions, setSubBrandOptions] = useState<{ label: string; value: number }[]>([]);
	const [isFetchingSubBrands, setIsFetchingSubBrands] = useState(false);

	// const fetchBrandDetails = useCallback(async (brandId: number): Promise<void> => {
	//   setIsFetchingDetails(true);
	//   try {
	//     const res = await postBrandDetailsApi({ brandId });
	//     const data = res?.data || res;
	//     const communityInfos = parseCommunityInfos(data.regions);

	//     form.setFieldsValue({
	//       brandName: data.brandName,
	//       brandIntro: data.brandIntro,
	//       pmoId: data.pmoId,
	//       pmoName: data.pmoName,
	//       specialistId: data.specialistId,
	//       specialistName: data.specialistName,
	//       communityInfos,
	//       brandLogo: data.brandLogo
	//         ? [
	//           {
	//             uid: "-1",
	//             name: "image.png",
	//             status: "done",
	//             url: data.brandLogo,
	//           },
	//         ]
	//         : [],
	//     });
	//     setBrandLogoUrl(data.brandLogo);
	//   } catch {
	//     message.error("获取详情失败");
	//   } finally {
	//     setIsFetchingDetails(false);
	//   }
	// }, [form]);

	const fetchSubBrandList = useCallback(async () => {
		setIsFetchingSubBrands(true);
		try {
			const res = await getSubBrandList();
			const list = res ?? [];
			const options = list.map((item) => ({
				label: `${item.brandName}-${item.subBrandName}`,
				value: item.brandId,
			}));
			setSubBrandOptions(options);
		} catch {
			message.error("获取关联品牌列表失败");
		} finally {
			setIsFetchingSubBrands(false);
		}
	}, []);

	useEffect(() => {
		if (!isModalOpen) return;

		fetchSubBrandList(); // 弹窗打开时获取关联品牌

		if (type === "edit" && initialValues?.brandId) {
			// fetchBrandDetails(initialValues.brandId);
			const initValue: UpdateFormValues = {
				// id: initialValues.brandId,
				brandId: initialValues.brandId,
				brandName: initialValues.brandName,
				brandLogo: initialValues.brandLogo,
				brandIntro: initialValues.brandIntro,
				subBrandId: initialValues.subBrandNames.split(",").map((item) => +item),
			};
			setBrandLogoUrl(buildMaterialFileUrl(fileHost, initialValues.brandLogo) || undefined);
			form.setFieldsValue({ ...initValue });
		} else {
			form.resetFields();
			setIsFetchingDetails(false);
			setBrandLogoUrl(undefined);
		}
	}, [isModalOpen, type, initialValues, form]);

	const handleSubmit = async (): Promise<void> => {
		try {
			const values = await form.validateFields();
			setIsSubmitting(true);

			// const brandLogoFile =
			// 	Array.isArray(values.brandLogo) && values.brandLogo.length > 0 ? values.brandLogo[0] : values.brandLogo;
			// const brandLogo = brandLogoFile?.response?.fileName;

			const requestData = {
				brandName: values.brandName,
				brandLogo: values.brandLogo,
				brandIntro: values.brandIntro,
				subBrandIds: values.subBrandId,
			};

			if (type === "create") {
				// await postBrandSaveApi(requestData);
				await saveBrand(requestData);
				message.success("创建成功");
			} else {
				if (!initialValues?.brandId) {
					message.error("缺少品牌ID");
					return;
				}
				const updateParams = {
					...requestData,
					id: +initialValues.brandId,
				};
				await updateBrand(updateParams);
				// await postBrandUpdateApi({
				//   ...requestData,
				//   brandId: initialValues.brandId,
				// });
				message.success("更新成功");
			}

			onSuccess?.();
			onClose();
		} catch (error) {
			if (error instanceof Error) {
				console.error(error.message);
				message.error(error.message);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const beforeUpload = (file: File): boolean | typeof Upload.LIST_IGNORE => {
		const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type);
		if (!isAllowedType) {
			message.error("请上传 JPG/PNG 格式的图片!");
		}
		const isWithinSizeLimit = file.size / BYTES_PER_MB < MAX_FILE_SIZE_MB;
		if (!isWithinSizeLimit) {
			message.error("图片大小不能超过 5MB!");
		}
		return isAllowedType && isWithinSizeLimit ? true : Upload.LIST_IGNORE;
	};

	const handleBrandLogoRequest = async (options: CustomRequestOptions): Promise<void> => {
		const { file, onSuccess: onUploadSuccess, onError, onProgress } = options;
		try {
			const res = await uploadService.uploadFile({
				file: file as File,
				moduleCode: FileModuleCode.USER_AVATAR,
				onProgress: (percent: number) => {
					onProgress?.({ percent });
				},
			});
			onUploadSuccess?.(res, file as unknown as XMLHttpRequest);
		} catch (err) {
			onError?.(err as Error);
			message.error("品牌 Logo 上传失败");
		}
	};

	const handleUploadChange = (info: UploadChangeParam<UploadFile>): void => {
		if (info.file.status === "uploading") {
			setIsUploading(true);
			return;
		}
		if (info.file.status === "done") {
			setIsUploading(false);
			setBrandLogoUrl(info.file.response?.url);
			form.setFieldValue("brandLogo", info.file.response?.fileName);
			// setIsUploading(false);
			// setBrandLogoUrl(info.file.response?.url);
		}
		if (info.file.status === "error") {
			setIsUploading(false);
		}
	};

	const getFileListFromEvent = (e: UploadChangeParam | UploadFile[]): UploadFile[] | undefined => {
		if (Array.isArray(e)) return e;
		return (e as UploadChangeParam)?.fileList;
	};

	return {
		form,
		isSubmitting,
		isFetchingDetails,
		isUploading,
		brandLogoUrl,
		handleSubmit,
		beforeUpload,
		handleBrandLogoRequest,
		handleUploadChange,
		getFileListFromEvent,
		subBrandOptions,
		isFetchingSubBrands,
	};
};
