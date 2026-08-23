import apiClient from "../apiClient";
import type {
	CarModelTreeNode,
	DownloadListParams,
	MarkedMaterialParams,
	MaterialAuditActionPayload,
	MaterialAuditListParams,
	MaterialAuditListResponse,
	MaterialBatchAuditActionPayload,
	MaterialBatchEditPayload,
	MaterialBrandItem,
	MaterialListResponse,
	MaterialUploadPayload,
	MyMaterialListParams,
	SystemUserItem,
	SystemUserListData,
	TagOption,
	UnmarkedMaterialParams,
} from "./types";
import { baseUrl } from "./const";

export const MaterialApi = {
	DownloadList: `${baseUrl}/material/list/download`,
	MarkedList: `${baseUrl}/material/list/marked-already`,
	UnmarkedList: `${baseUrl}/material/list/unmarked`,
	Delete: `${baseUrl}/material`,
	BatchDelete: `${baseUrl}/material/batch/delete`,
	Edit: `${baseUrl}/material`,
	Photographers: `${baseUrl}/setting/photographers`,
	MaterialTypeList: `${baseUrl}/material/list/materialTypeList`,
	MaterialTypeListAll: `${baseUrl}/material/list/materialTypeListAll`,
	AllTypeList: `${baseUrl}/material/list/allTypeList`,
	Supplement: `${baseUrl}/material`,
	BatchSupplement: `${baseUrl}/material/batch/supplement`,
	GenerateAITags: `${baseUrl}/material/generate-ai-tags`,
	DownloadUrl: `${baseUrl}/material`,
	DownloadSucceed: `${baseUrl}/material`,
	BrandList: `${baseUrl}/brand/list`,
	CarModelListByBrand: `${baseUrl}/config/car-model-list-by-brand`,
	MaterialAuditList: `${baseUrl}/material/list/first-audit`,
	MaterialCorrectionList: `${baseUrl}/material/list/edit-audit`,
	MaterialBatchAudit: `${baseUrl}/material/batch/material-audit`,
	MaterialBatchEditAudit: `${baseUrl}/material/batch/edit-audit`,
	SystemUserList: "/admin/account/listAll",
	MaterialAdd: `${baseUrl}/material/add`,
	BatchEdit: `${baseUrl}/material/batch/edit`,
	MyList: `${baseUrl}/material/list/my`,
} as const;

const getMarkedMaterials = (params: MarkedMaterialParams) =>
	apiClient.get<MaterialListResponse>(MaterialApi.MarkedList, { params });

const getUnmarkedMaterials = (params: UnmarkedMaterialParams) =>
	apiClient.get<MaterialListResponse>(MaterialApi.UnmarkedList, { params });

const deleteMaterial = (data: { id: string | number }) =>
	apiClient.post<unknown>(`${MaterialApi.Delete}/${data.id}/delete`, data);

const batchDeleteMaterials = (data: { ids: Array<string | number> }) =>
	apiClient.post<unknown>(MaterialApi.BatchDelete, data);

const editMaterial = (data: Record<string, unknown> & { id: string | number }) =>
	apiClient.post<unknown>(`${MaterialApi.Edit}/${data.id}/edit`, data);

const getPhotographers = () => apiClient.get<string[]>(MaterialApi.Photographers);

const getMaterialTypeList = () => apiClient.get<TagOption[]>(MaterialApi.MaterialTypeList);

const getMaterialTypeListAll = () =>
	apiClient.get<Array<{ id: number; typeName: string }>>(MaterialApi.MaterialTypeListAll);

const getAllTypeList = () => apiClient.get<Array<{ id: number; typeName: string }>>(MaterialApi.AllTypeList);

const supplementMaterial = (data: {
	id: string | number;
	tagIds: number[];
	shootDate?: string;
	brandId?: number;
	vehicleModelId?: number;
	quality?: number;
	name?: string;
	photographer?: string;
}) => apiClient.post<unknown>(`${MaterialApi.Supplement}/${data.id}/supplement`, data);

const batchSupplementMaterial = (data: { ids: Array<string | number>; tagIds: number[] }) =>
	apiClient.post<unknown>(MaterialApi.BatchSupplement, data);

const generateAITags = (data: { materialIds: (string | number)[] }) =>
	apiClient.post<unknown>(MaterialApi.GenerateAITags, data);

const getMaterialDownloadUrl = (params: { id: string | number }) =>
	apiClient.get<string>(`${MaterialApi.DownloadUrl}/${params.id}/download/url`, {
		params: { id: params.id },
	});

const downloadSucceed = (params: { id: string | number }) =>
	apiClient.get<unknown>(`${MaterialApi.DownloadSucceed}/${params.id}/download/succeed`, {
		params: { id: params.id },
	});

const getBrandList = () => apiClient.get<MaterialBrandItem[]>(MaterialApi.BrandList);

const getCarModelListByBrand = (brandId: number) =>
	apiClient.get<CarModelTreeNode[]>(`${MaterialApi.CarModelListByBrand}/${brandId}`);

const getMaterialAuditList = (params: MaterialAuditListParams) =>
	apiClient.get<MaterialAuditListResponse>(MaterialApi.MaterialAuditList, { params });

const auditMaterial = (data: { id: string | number } & MaterialAuditActionPayload) =>
	apiClient.post<unknown>(`${MaterialApi.Edit}/${data.id}/material-audit`, data);

const batchAuditMaterial = (data: MaterialBatchAuditActionPayload) =>
	apiClient.post<unknown>(MaterialApi.MaterialBatchAudit, data);

const getMaterialCorrectionList = (params: MaterialAuditListParams) =>
	apiClient.get<MaterialAuditListResponse>(MaterialApi.MaterialCorrectionList, { params });

const auditMaterialCorrection = (data: { id: string | number } & MaterialAuditActionPayload) =>
	apiClient.post<unknown>(`${MaterialApi.Edit}/${data.id}/edit-audit`, data);

const batchAuditMaterialCorrection = (data: MaterialBatchAuditActionPayload) =>
	apiClient.post<unknown>(MaterialApi.MaterialBatchEditAudit, data);

const getSystemUserList = async (): Promise<SystemUserItem[]> => {
	const users = await apiClient.get<SystemUserListData>(MaterialApi.SystemUserList);
	return Array.isArray(users) ? users : [];
};

const uploadMaterial = (data: MaterialUploadPayload) => apiClient.post<unknown>(MaterialApi.MaterialAdd, data);

const reUploadMaterial = (data: { id: string | number } & MaterialUploadPayload) =>
	apiClient.post<unknown>(`${MaterialApi.Edit}/${data.id}/reupload`, data);

const batchEditMaterial = (data: MaterialBatchEditPayload) => apiClient.post<unknown>(MaterialApi.BatchEdit, data);

const getMyMaterialList = (params: MyMaterialListParams) =>
	apiClient.get<MaterialListResponse>(MaterialApi.MyList, { params });

const getDownloadList = (params: DownloadListParams) =>
	apiClient.get<MaterialListResponse>(MaterialApi.DownloadList, { params });

export default {
	getMarkedMaterials,
	getUnmarkedMaterials,
	deleteMaterial,
	batchDeleteMaterials,
	editMaterial,
	getPhotographers,
	getMaterialTypeList,
	getMaterialTypeListAll,
	getAllTypeList,
	supplementMaterial,
	batchSupplementMaterial,
	generateAITags,
	getMaterialDownloadUrl,
	downloadSucceed,
	getBrandList,
	getCarModelListByBrand,
	getMaterialAuditList,
	auditMaterial,
	batchAuditMaterial,
	getMaterialCorrectionList,
	auditMaterialCorrection,
	batchAuditMaterialCorrection,
	getSystemUserList,
	uploadMaterial,
	reUploadMaterial,
	batchEditMaterial,
	getMyMaterialList,
	getDownloadList,
};
