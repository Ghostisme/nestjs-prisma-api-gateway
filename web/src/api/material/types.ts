/** 素材列表项（已打标/未打标通用字段） */
export interface MaterialRow {
	id: string | number;
	name: string;
	coverUrl: string;
	objectUrl: string;
	durationSec?: number;
	size?: string;
	resolution?: string;
	downloadCount: number;
	photographer?: string;
	shootTime?: number;
	lastDownloadTime?: number;
	createdTime?: string;
	createdUserName?: string;
	quality?: 0 | 1 | 2;
	status?: string;
	reason?: string;
	auditingInfo?: { name?: string };
	aiTagStatus?: string;
	tagSource?: string;
	aiTagRejectReason?: string;
	brandId?: number;
	carModelInfo?: {
		brandName: string;
		subBrandName: string;
		seriesName: string;
		carName: string;
		subBrandId?: number;
		seriesId?: number;
		carId?: number;
	};
	aiTags?: Array<{ id: number; typeName?: string; tagName?: string; name?: string }>;
	currentTags?: Array<{ id: string | number; typeName?: string; tagName?: string; name?: string }>;
	currentTypes?: Array<{ id: number; typeName?: string; tagName?: string; name?: string }>;
	vehicleBrandServiceModelId?: number[];
	brandLogoUrl?: string;
}

export interface MaterialAuditTag {
	id: number;
	parentId?: number;
	typeName?: string;
	tagName?: string;
	name?: string;
	isNew?: boolean;
}

export interface MaterialAuditInfo {
	name?: string;
	photographer?: string;
	shootDate?: string;
	brandId?: number;
	auditingTags?: MaterialAuditTag[];
}

export interface MaterialAuditRow extends MaterialRow {
	updatedTime?: string;
	updateUserName?: string;
	currentTags?: MaterialAuditTag[];
	aiTags?: MaterialAuditTag[];
	auditingInfo?: MaterialAuditInfo;
	nTags?: MaterialAuditTag[];
}

/** 上传中心-我的素材列表请求参数 */
export interface MyMaterialListParams {
	status?: string;
	page?: number;
	pageSize?: number;
}

/** 下载中心-下载列表请求参数 */
export interface DownloadListParams {
	status?: string;
	page?: number;
	pageSize?: number;
}

/** 已打标素材列表请求参数 */
export interface MarkedMaterialParams {
	page?: number;
	pageSize?: number;
	keyword?: string;
	time?: string;
	type?: number;
	orderBy?: "time" | "quality" | "download";
	quality?: number;
	tagIds?: string | number[];
	shootDate?: string | string[];
	date?: string;
	photographer?: string;
	brandModelSeries?: string;
	createdTime?: string;
}

/** 未打标素材列表请求参数 */
export interface UnmarkedMaterialParams {
	page?: number;
	pageSize?: number;
	keyword?: string;
	time?: string;
	type?: number;
	orderBy?: "time" | "quality" | "download";
	quality?: number;
	types?: string;
	cumTagId?: number[];
	shootDate?: string | string[];
	date?: string;
	brandId?: number;
	brandModelSeries?: string | number[];
	status?: string;
	photographer?: string;
}

export interface MaterialAuditListParams {
	page?: number;
	pageSize?: number;
	type?: number;
	createdBy?: number | string;
	photographer?: string;
	brandModelSeries?: string;
}

export interface MaterialAuditActionPayload {
	result: boolean;
	reason: string;
}

export interface MaterialBatchAuditActionPayload extends MaterialAuditActionPayload {
	ids: Array<string | number>;
}

export interface MaterialBatchEditPayload {
	ids: Array<string | number>;
	request: {
		name?: string;
		tagIds?: number[];
		shootDate?: string;
		brandId?: number;
		vehicleModelId?: number;
		vehicleServiceId?: number;
		vehicleBrandServiceModelId?: number[];
		photographer?: string;
		quality?: number;
		typeNameList?: string[];
	};
}

export interface MaterialUploadPayload {
	name: string;
	md5: string;
	storageKey: string;
	brandId?: number;
	vehicleModelId?: number;
	vehicleServiceId?: number;
	vehicleBrandServiceModelId?: string | number[];
	photographer?: string;
	shootDate?: string;
	typeNameList?: string | string[];
	compressedStorageKey?: string;
}

/** 列表接口返回 */
export interface MaterialListResponse {
	list: MaterialRow[];
	total: number;
}

export interface MaterialAuditListResponse {
	list: MaterialAuditRow[];
	total: number;
}

/** 标签/分类项（自定义分类、人工标签等） */
export interface TagOption {
	id: number;
	label?: string;
	value?: number;
	typeName?: string;
	tagName?: string;
	name?: string;
	children?: TagOption[];
}

/** 素材品牌项（/material/v1/brand/list） */
export interface MaterialBrandItem {
	brandId: number;
	brandName: string;
	brandLogo: string;
	brandIntro: string;
	createTime: number;
	createUser: string;
	subBrandNames: string;
}

/** 车型级联节点 — car-model-list-by-brand 接口返回的子品牌→车系→车型树 */
export interface CarModelTreeNode {
	subBrandId: number;
	subBrandName: string;
	seriesList?: Array<{
		seriesId: number;
		seriesName: string;
		carModels?: Array<{
			carId: number;
			carName: string;
		}>;
	}>;
}

export interface SystemUserItem {
	userId: string | number;
	name: string;
}

/** 系统用户接口业务数据（响应结构: { code, msg, data }） */
export type SystemUserListData = SystemUserItem[];
