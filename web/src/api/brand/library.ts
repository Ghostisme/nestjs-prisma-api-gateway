// import { faker } from "@faker-js/faker";
// import { v4 as uuidv4 } from "uuid";
import apiClient from "../apiClient";
import type {
	BrandContactListRequest,
	BrandExportRequest,
	BrandGetRegionsRequest,
	BrandInfo,
	BrandLogsRequest,
	BrandOfflineRequest,
	BrandPageRequest,
	BrandRegionDeleteRequest,
	BrandSaveRequest,
	BrandUpdateRequest,
	CreateSaveBrandRequest,
	SubBrandItem,
	UpdateSaveBrandRequest,
} from "./types";

// const wxApiClient = new ApiClient({
// 	baseURL: "/api/material",
// });

const Path = "/xdwx-material";

// export const postTokenApi = (data: {
//   mobile: string;
//   code: string;
//   randomStr?: string;
// }) => apiClient.post(`${Path}/oauth2/token`, data);
/**
 * 品牌列表查询
 * /brand/page
 */
// export const postBrandPageApi = async (data: BrandPageRequest, isWx: boolean = false): Promise<BrandInfo[]> => {
// 	let result: Promise<BrandInfo[]> = new Promise((resolve) => resolve([]));
// 	if (isWx) {
// 		const res = await wxApiClient.get(`${Path}/v1/brand/list`, { params: data });
// 		console.log(res, "万象老的数据结构");
// 		result = new Promise((resolve) =>
// 			resolve(
// 				res.map((item: any) => ({
// 					brandId: item.id,
// 					brandLogo: item.url,
// 					brandLogoId: faker.string.uuid(),
// 					brandName: item.name,
// 					brandStatus: 1,
// 					brandStatusDesc: item.desc,
// 					createTime: item.create_time,
// 					pmoId: faker.string.uuid(),
// 					pmoName: item.create_user,
// 					regionCount: faker.number.int(),
// 					specialistId: faker.string.uuid(),
// 					specialistName: faker.person.fullName(),
// 					updateTime: item.create_time,
// 				})),
// 			),
// 		) as Promise<BrandInfo[]>;
// 	} else {
// 		result = apiClient.post(`${Path}/brand/page`, data);
// 	}
// 	return result;
// };
export const postBrandPageApi = (data: BrandPageRequest): Promise<BrandInfo[]> =>
	apiClient.get(`${Path}/v1/brand/list`, { params: data });
// export const postWxBrandPageApi = (data: BrandPageRequest) => wxApiClient.get(`/v1/brand/list`, { params: data });

/**
 * 新建品牌
 * /brand/save
 */
export const postBrandSaveApi = (data: BrandSaveRequest) => apiClient.post(`${Path}/brand/save`, data);

/**
 * 编辑品牌
 * /brand/update
 */
export const postBrandUpdateApi = (data: BrandUpdateRequest) => apiClient.post(`${Path}/brand/update`, data);

/**
 * 查看品牌详情
 * /brand/details
 */
export const postBrandDetailsApi = (data: { brandId: number }) => apiClient.post(`${Path}/brand/details`, data);

/**
 * 导出品牌基础信息
 * /brand/export
 */
export const postBrandExportApi = (data: BrandExportRequest) => apiClient.post(`${Path}/brand/export`, data);

/**
 * 品牌下线
 * /brand/offline
 */
export const postBrandOfflineApi = (data: BrandOfflineRequest) => apiClient.post(`${Path}/brand/offline`, data);

/**
 * 删除品牌大区
 * /brand/region/delete
 */
export const postBrandRegionDeleteApi = (data: BrandRegionDeleteRequest) =>
	apiClient.post(`${Path}/brand/region/delete`, data);
/**
 * 查看品牌操作记录
 * /brand/logs
 */
export const postBrandLogsApi = (data: BrandLogsRequest) => apiClient.post(`${Path}/brand/logs`, data);

/**
 * 查看品牌下的大区列表
 * /brand/getRegionsByBrandId
 */
export const postBrandGetRegionsByBrandIdApi = (data: BrandGetRegionsRequest) =>
	apiClient.post(`${Path}/brand/getRegionsByBrandId`, data);
/**
 * 获取所有品牌信息
 * /brand/getAllBrandInfo
 */
export const postBrandGetAllBrandInfoApi = () => apiClient.post(`${Path}/brand/getAllBrandInfo`);

// /**
//  * 获取品牌对接人/数据专员信息
//  * /brand/contact/list
//  */
// export const postBrandContactListApi = (data: BrandContactListRequest) =>
//   apiClient.post(`${Path}/brand/contact/list`, data);

/**
 * 获取数据专员信息
 * /brand/specialist/list
 */
export const postBrandSpecialistListApi = (data: BrandContactListRequest) =>
	apiClient.post(`${Path}/brand/specialist/list`, data);
/**
 * 获取品牌对接人信息
 * /brand/pmo/list
 */
export const postBrandPmoListApi = (data: BrandContactListRequest) => apiClient.post(`${Path}/brand/pmo/list`, data);

/**
 * 导出品牌基础信息
 * /brand/export
 */
// export const postBrandExportBrandInfoApi = (data: BrandExportRequest) => apiClient.post(`${Path}/brand/export`, data);
export const postBrandExportBrandInfoApi = `${Path}/brand/export`;

/* ========= 老的万象版本相关接口 ============== */
// 获取关联品牌
export const getSubBrandList = (): Promise<SubBrandItem[]> => apiClient.get(`${Path}/v1/config/sub_brand/list`);

// 创建品牌
export const saveBrand = (data: CreateSaveBrandRequest): Promise<null> =>
	apiClient.post(`${Path}/v1/brand/create`, data);

// 编辑品牌
export const updateBrand = (data: UpdateSaveBrandRequest): Promise<null> =>
	apiClient.post(`${Path}/v1/brand/${data.id}/update`, data);

// 删除品牌
export const delBrand = (id: number): Promise<null> => apiClient.post(`${Path}/v1/brand/${id}/delete`);
