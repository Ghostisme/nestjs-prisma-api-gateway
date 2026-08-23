import apiClient from "../apiClient";

export enum TagApi {
	List = "/xdwx-material/v1/tag/list",
	Create = "/xdwx-material/v1/tag/create",
	Update = "/xdwx-material/v1/tag/update",
}

export interface SubTag {
	id: number;
	name: string;
}

export interface TagRecord {
	id: number;
	name: string;
	required: boolean;
	scopeType: number;
	subTags: SubTag[];
	createTime: string;
	createUserName: string;
}

export interface TagListParams {
	keyword?: string;
	page?: number;
	pageSize?: number;
	scopeType?: number;
}

export interface TagListResponse {
	list: TagRecord[];
	total: number;
}

export interface TagSaveParams {
	name: string;
	required: boolean;
	scopeType: number;
	subTagNames: string[];
}

export interface TagUpdateParams extends TagSaveParams {
	id: number;
}

const getTagList = (params?: TagListParams) =>
	apiClient.get<TagListResponse>(TagApi.List, { params: { ...params, pageSize: 1000 } });

const createTag = (data: TagSaveParams) => apiClient.post(TagApi.Create, data);

const updateTag = (data: TagUpdateParams) => apiClient.post(TagApi.Update, data);

const deleteTag = (id: number) => apiClient.post(`/xdwx-material/v1/tag/delete/${id}`);

export const tagService = {
	getTagList,
	createTag,
	updateTag,
	deleteTag,
};
