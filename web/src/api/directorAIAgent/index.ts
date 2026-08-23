import type { BrandInfo } from "@/api/brand/types.ts";
import type {
	AiScriptContentParams,
	AiScriptDetailRes,
	AreaTreeVO,
	ApplyScriptParams,
	ConfigListRes,
	CreateParams,
	EditScriptCaseContentParams,
	GetBrandSeriesModelRes,
	GetScriptListParams,
	GetScriptListRes,
	ScriptCaseStatusResponse,
	ScriptAiListRes,
	SellingPointDetailRes,
	SellingPointListParams,
	SellingPointListRes,
	UserListRes,
} from "@/api/directorAIAgent/types.ts";
import apiClient from "../apiClient";

/**
 * 脚本列表
 * @param {GetScriptListParams} data
 * @returns {Promise<GetScriptListRes[]>}
 */
export const getScriptList = (data: GetScriptListParams) =>
	apiClient.post<GetScriptListRes[]>("/xdwx-material/v1/script/list", data);
/**
 * 用户管理列表
 * @returns {Promise<UserListRes>}
 */
export const getUserList = () => apiClient.get<UserListRes[]>("/admin/account/listAll");
/**
 * 品牌列表
 * @returns {Promise<BrandInfo[]>}
 */
export const getBrand = () => apiClient.get<BrandInfo[]>("/xdwx-material/v1/brand/list");
/**
 * 品牌系列车型列表
 * @param {number} id
 * @returns {Promise<GetBrandSeriesModelRes[]>}
 */
export const getBrandSeriesModel = (id: number) =>
	apiClient.get<GetBrandSeriesModelRes[]>(`/xdwx-material/v1/script/brand-series-model/${id}`);
/**
 * 删除脚本
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteScript = (id: number) => apiClient.post<void>(`/xdwx-material/v1/script/delete/${id}`);
/**
 * 编辑脚本案例内容
 * @param {EditScriptCaseContentParams} data
 * @returns {Promise<void>}
 */
export const editScriptCaseContent = (data: EditScriptCaseContentParams) =>
	apiClient.post<void>("/xdwx-material/v1/script/case/content/edit", data);
/**
 * 卖点列表
 * @param {SellingPointListParams} data
 * @returns {Promise<SellingPointListRes>}
 */
export const getSellingPointList = (data: SellingPointListParams) =>
	apiClient.post<SellingPointListRes>("/xdwx-material/v1/selling-point/list", data);
/**
 * 删除卖点
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteSellingPoint = (id: number) => apiClient.delete<void>(`/xdwx-material/v1/selling-point/${id}`);
/**
 * 创建卖点
 * @param {CreateParams} params
 * @returns {Promise<void>}
 */
export const createSellingPoint = (params: CreateParams) =>
	apiClient.post<void>("/xdwx-material/v1/selling-point/create", params);
/**
 * 更新卖点
 * @param {number} id
 * @param {CreateParams} data
 * @returns {Promise<void>}
 */
export const updateSellingPoint = (id: number, data: CreateParams) =>
	apiClient.put<void>(`/xdwx-material/v1/selling-point/${id}`, data);
/**
 * 申请AI脚本
 * @param {ApplyScriptParams} data
 * @returns {Promise<Record<string, unknown>[]>}
 */
export const applyScript = (data: ApplyScriptParams) =>
	apiClient.post<number[]>("/xdwx-material/v1/script/apply", data);
/**
 * 卖点详情
 * @param {string} modelId
 * @returns {Promise<SellingPointDetailRes>}
 */
export const getSellingPointDetail = (modelId: string) =>
	apiClient.get<SellingPointDetailRes>(`/xdwx-material/v1/selling-point/detail/model/${modelId}`);
/**
 * 获取AI脚本列表
 * @param {number[]} data
 * @returns {Promise<ScriptAiListRes[]>}
 */
export const getScriptAiList = (data: number[]) =>
	apiClient.post<ScriptAiListRes[]>("/xdwx-material/v1/script/case/status/list", data);
/**
 * 重新生成AI脚本
 * @param {number} id
 * @returns {Promise<number>}
 */
export const getRegenerateScriptId = (id: number) =>
	apiClient.post<number>(`/xdwx-material/v1/script/case/regenerate/${id}`);
/**
 * 编辑AI脚本内容
 * @param {AiScriptContentParams} data
 * @returns {Promise<void>}
 */
export const editAiScriptContent = (data: AiScriptContentParams) =>
	apiClient.post<void>("/xdwx-material/v1/script/case/content/edit", data);
/**
 * 获取AI脚本详情
 * @param {number} id
 * @returns {Promise<GetScriptListRes>}
 */
export const getAiScriptDetail = (id: number) =>
	apiClient.get<AiScriptDetailRes>(`/xdwx-material/v1/script/detail/${id}`);
/**
 * 采纳脚本方案
 * @param {number} id
 * @returns {Promise<void>}
 */
export const adoptAiScriptApi = (id: number) => apiClient.post<void>(`/xdwx-material/v1/script/case/adopt/${id}`);
/**
 * 复制脚本案例
 * @param {number} id
 * @returns {Promise<void>}
 */
export const copyAiScriptApi = (id: number) => apiClient.post<void>(`/xdwx-material/v1/script/copy/${id}`);
/**
 * 查询所有呈现形式配置
 * @returns {Promise<void>}
 */
export const configList = () => apiClient.post<ConfigListRes[]>("/xdwx-material/v1/presentation/config/list");
/**
 * 脚本反馈
 * /v1/script/case/feedback
 */
export const scriptFeedback = (data: {
	/**
	 * 脚本案例ID
	 */
	caseId: number;
	/**
	 * 反馈标记：0-满意，1-不满意
	 */
	feedbackFlag: number;
}) => apiClient.post<void>("/xdwx-material/v1/script/case/feedback", data);

/**
 * 查询所有省市区/县信息的树形结构
 * GET /admin/area/areaTree
 */
export const getAreaTree = () => apiClient.get<AreaTreeVO[]>("/admin/area/areaTree");

/**
 * 获取登录用户的脚本案例列表
 * GET /v1/script/case/list
 */
export const getScriptCaseList = () => apiClient.get<ScriptCaseStatusResponse[]>("/xdwx-material/v1/script/case/list");
