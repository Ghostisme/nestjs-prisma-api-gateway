import apiClient from "../apiClient";
import type { ModelPageRequest, BrandModelSaveRequest } from "./types";
const Path = "/xdbdt";
/**
 * 品牌车型分页查询
 * /brand/model/page
 */
export const postBrandModelPageApi = (data: ModelPageRequest) => apiClient.post(`${Path}/brand/model/page`, data);
/**
 * 新增品牌车型
 * /brand/model/save
 */
export const postBrandModelSaveApi = (data: BrandModelSaveRequest) => apiClient.post(`${Path}/brand/model/save`, data);

/**
 * 品牌车型导出
export const postBrandModelExportApi = (data: ModelPageRequest) => apiClient.post(`${Path}/brand/model/export`, data);
 */
export const postBrandModelExportApi = `${Path}/brand/model/export`;
/**
 * 品牌车型列表
 * /brand/model/list
 */
export const postBrandModelListApi = (data: {
	/**
	 * 品牌ID
	 */
	brandId: number;
}) => apiClient.post(`${Path}/brand/model/list`, data);

export interface CarModelListRequest {
	/**
	 * 车型名称（模糊匹配）
	 */
	carName?: string;
	/**
	 * 品牌名称（模糊匹配）
	 */
	brandName?: string;
	/**
	 * 分页页码
	 */
	page: number;
	/**
	 * 分页大小
	 */
	size: number;
}
/**
 * 经销商门店操作记录分页查询
 * /brand/model/carModelList/byBrandNameAndCarName
 */
export const postCarModelListApi = (data: CarModelListRequest) =>
	apiClient.post(`${Path}/brand/model/carModelList/byBrandNameAndCarName`, data);
