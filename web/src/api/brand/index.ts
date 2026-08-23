import apiClient from "../apiClient";
const Path = "/xdbdt";

/**
 * 获取所有品牌信息
 * /brand/getAllBrandInfo
 */
export const postBrandGetAllBrandInfoApi = () => apiClient.post(`${Path}/brand/getAllBrandInfo`);

/**
 * 获取品牌绑定大区小区级联信息
 * /brand/getCascadingInfo
 */

export const postBrandGetCascadingInfoApi = (data: {
	brandId: {
		/**
		 * 品牌ID
		 */
		brandId?: number;
		/**
		 * 品牌名称
		 */
		brandName?: string;
	};
}) => apiClient.post(`${Path}/brand/getCascadingInfo`, data);
