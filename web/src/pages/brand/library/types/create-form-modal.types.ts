// import type { UploadFile } from "antd";
// import type { BrandRow } from "../types";
import type { BrandInfo } from "@/api/brand/types";

export interface FormValues {
	brandName: string;
	brandLogo: string;
	brandIntro: string;
	subBrandId: number[];
}

export interface UpdateFormValues extends FormValues {
	brandId: string;
}

export interface CreateFormModalProps {
	isModalOpen: boolean;
	onClose: () => void;
	type?: "create" | "edit";
	initialValues?: BrandInfo;
	onSuccess?: () => void;
}
