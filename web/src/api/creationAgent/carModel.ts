import apiClient from "../apiClient";

const baseUrl = "xdwx-material/v1";

export interface GetCarModelListParams {
	page?: number;
	pageSize?: number;
	orderBy?: string;
	order?: "SORT_ORDER_ASC" | "SORT_ORDER_DESC";
	keyword?: string;
	brandId?: number;
	modelName?: string;
	status?: boolean;
}

export interface CarModelListItem {
	id: number;
	brandId: number;
	brandName: string;
	modelName: string;
	coverImageUrl: string;
	sellingPoints: string[];
	promotionPolicies: string[];
	status: string;
	statusDesc: string;
	updateTime: number;
}

export interface GetCarModelListRes {
	pageNumber: number;
	pageSize: number;
	total: number;
	totalPages: number;
	more: boolean;
	timestamp: number;
	list: CarModelListItem[];
}

export interface CreateCarModelParams {
	modelName: string;
	coverImageUrl?: string;
	sellingPoints?: string[];
	promotionPolicies?: string[];
}

export interface UpdateCarModelParams {
	id: number;
	modelName: string;
	coverImageUrl?: string;
	sellingPoints?: string[];
	promotionPolicies?: string[];
}

export interface BatchStatusParams {
	ids: number[];
	status: boolean;
}

export const getCarModelList = (data: GetCarModelListParams) =>
	apiClient.post<GetCarModelListRes>(`${baseUrl}/car-model-manage/list`, data);

export const createCarModel = (data: CreateCarModelParams) =>
	apiClient.post<void>(`${baseUrl}/car-model-manage/create`, data);

export const updateCarModel = (data: UpdateCarModelParams) =>
	apiClient.put<void>(`${baseUrl}/car-model-manage/update`, data);

export const deleteCarModel = (id: number) => apiClient.delete<void>(`${baseUrl}/car-model-manage/delete/${id}`);

export const batchStatusCarModel = (data: BatchStatusParams) =>
	apiClient.post<void>(`${baseUrl}/car-model-manage/batch-status`, data);

export const batchImportCarModel = (file: File) => {
	const formData = new FormData();
	formData.append("file", file);
	return apiClient.post<void>(`${baseUrl}/car-model-manage/batch-import`, formData);
};

export const downloadSellingTemplate = () => apiClient.download(`${baseUrl}/car-model-manage/template/download`);
