import apiClient from "./apiClient";

import { baseUrl } from "./material/const";

export const MaterialApi = {
	SettingInfo: `${baseUrl}/setting/info`,
} as const;

/** 设置信息接口返回（文件访问前缀、空间占用等） */
export type SettingInfo = {
	/** 请求文件主机前缀，用于拼接素材图片/文件访问路径 */
	requestFileHost: string;
	/** 空间占用信息 */
	occupySize?: string;
};

export const getSettingInfo = () => apiClient.get<SettingInfo>(MaterialApi.SettingInfo);

export default {
	getSettingInfo,
};
