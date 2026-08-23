import apiClient from "../apiClient";

const BASE_URL = "/xdwx-material/v1/raw-material-library";

export const RawMaterialApi = {
	List: `${BASE_URL}/items`,
	Tree: `${BASE_URL}/nodes/tree`,
	CreateFolder: `${BASE_URL}/nodes/folder`,
	CreateAsset: `${BASE_URL}/nodes/asset`,
	Update: (id: number | string) => `${BASE_URL}/nodes/${id}/update`,
	Move: (id: number | string) => `${BASE_URL}/nodes/${id}/move`,
	Delete: (id: number | string) => `${BASE_URL}/nodes/${id}/delete`,
	DownloadUrl: (id: number | string) => `${BASE_URL}/nodes/${id}/download/url`,
	PresignedUrl: `${BASE_URL}/upload/presigned-url`,
};

export interface RawMaterialNode {
	id: number;
	parentId: number;
	nodeType: "FOLDER" | "ASSET";
	name: string;
	mediaType?: "video" | "image";
	sizeBytes?: string;
	updateTime: number;
	preReviewStatus?: string;
	brandId?: number;
	vehicleModelId?: number;
}

export interface RawMaterialListParams {
	parentId: number;
	page: number;
	pageSize: number;
	mediaTypeView?: "all" | "video" | "image";
	preReviewStatus?: string;
	brandId?: number;
	vehicleModelId?: number;
}

export interface RawMaterialListResponse {
	list: RawMaterialNode[];
	total: number;
	pageNumber: number;
	totalPages: number;
}

export interface RawMaterialFolderPayload {
	parentId: number;
	name: string;
}

export interface RawMaterialAssetPayload {
	parentId: number;
	name: string;
	md5: string;
	storageKey: string;
	mediaType: string;
	sizeBytes: number;
}

export interface RawMaterialUpdatePayload {
	name: string;
}

export interface RawMaterialMovePayload {
	targetParentId: number;
}

export interface PresignedUrlPayload {
	md5: string;
	filename: string;
	size: number;
}

export interface PresignedUrlResponse {
	existed: boolean;
	objectKey: string;
	presignedUrl?: string;
}

const getList = (params: RawMaterialListParams) =>
	apiClient.get<RawMaterialListResponse>(RawMaterialApi.List, { params });

const getTree = (parentId: number = 0) =>
	apiClient.get<RawMaterialNode[]>(RawMaterialApi.Tree, { params: { parentId } });

const createFolder = (data: RawMaterialFolderPayload) => apiClient.post<unknown>(RawMaterialApi.CreateFolder, data);

const createAsset = (data: RawMaterialAssetPayload) => apiClient.post<unknown>(RawMaterialApi.CreateAsset, data);

const updateNode = (id: number, data: RawMaterialUpdatePayload) =>
	apiClient.post<unknown>(RawMaterialApi.Update(id), data);

const moveNode = (id: number, data: RawMaterialMovePayload) => apiClient.post<unknown>(RawMaterialApi.Move(id), data);

const deleteNode = (id: number) => apiClient.post<unknown>(RawMaterialApi.Delete(id));

const getDownloadUrl = (id: number) => apiClient.get<string>(RawMaterialApi.DownloadUrl(id));

const getPresignedUrl = (data: PresignedUrlPayload) =>
	apiClient.post<PresignedUrlResponse>(RawMaterialApi.PresignedUrl, data);

export const rawMaterialService = {
	getList,
	getTree,
	createFolder,
	createAsset,
	updateNode,
	moveNode,
	deleteNode,
	getDownloadUrl,
	getPresignedUrl,
};
