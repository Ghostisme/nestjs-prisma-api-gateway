import apiClient from "../apiClient";
import { baseUrl } from "./const";

/** 标签列表（用于已打标动态筛选项等） */
export interface TagListParams {
	page?: number;
	pageSize?: number;
	status?: string;
}

export interface TagListItem {
	id: number;
	name: string;
	/** 与搜索条件字段对应，如 human_car / vehicle_static / material_status / body_color 等，用于动态筛选项 */
	type?: string;
	/** 应用范围：1 短视频，2 图片 */
	scopeType?: number;
	required?: boolean;
	subTags?: Array<{ id: number; name: string }>;
}

export interface TagListResponse {
	list: TagListItem[];
	total?: number;
}

export const getTagListApi = (params?: TagListParams) =>
	apiClient.get<TagListResponse>(`${baseUrl}/tag/list`, { params });
