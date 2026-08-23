import apiClient from "../apiClient";
const Path = "/xdbdt";
/**
 * 经销商门店搜索表单参数
 */
export interface DealerStoreSearchQueryParams {
	/**
	 * 品牌ID (对应：品牌名称)
	 * 备注：通常搜索时下拉选择品牌 ID
	 */
	brandId?: number;

	/**
	 * 经销商门店名称
	 */
	storeName?: string;

	/**
	 * 经销商门店代码
	 */
	storeCode?: string;

	/**
	 * 所属大区
	 */
	regionName?: string;

	/**
	 * 所属市
	 */
	cityName?: string;

	/**
	 * 经销商门店等级（S/A/B/C/D/NONE=无）
	 */
	storeLevel?: "S" | "A" | "B" | "C" | "D" | "NONE";

	/**
	 * 经销商门店状态（1=经营，2=退网）
	 */
	storeStatus?: 1 | 2;

	/**
	 * 所属优化师
	 */
	optimizerUserName?: string;

	/**
	 * 授权类型（FACTORY_AUTH=厂家授权，AGENCY_AUTH=代理授权，OTHER=其他）
	 */
	authType?: "FACTORY_AUTH" | "AGENCY_AUTH" | "OTHER";

	/**
	 * 加入时间起 (格式：YYYY-MM-DD)
	 */
	joinTimeStart?: string;

	/**
	 * 加入时间止 (格式：YYYY-MM-DD)
	 */
	joinTimeEnd?: string;

	/**
	 * 当前页
	 */
	current?: number;
	/**
	 * 每页条数
	 */
	size?: number;
}
/**
 * 经销商门店分页查询
 * /dealer/store/page
 */
export const postDealerStorePage = (data: DealerStoreSearchQueryParams) => {
	return apiClient.post(`${Path}/dealer/store/page`, data);
};

/**
 * DealerStoreUpdateDTO
 */
export interface DealerStoreSaveOrUpdate {
	/**
	 * 授权类型（FACTORY_AUTH=厂家授权，AGENCY_AUTH=代理授权，OTHER=其他）
	 */
	authType: string;
	/**
	 * 品牌ID
	 */
	brandId: string;
	/**
	 * 城市ID
	 */
	cityId: string | number;
	/**
	 * 城市名称
	 */
	cityName?: string;
	/**
	 * 小区ID
	 */
	communityId?: string;
	/**
	 * 门店ID（编辑时必填）
	 */
	id?: string;
	/**
	 * 优化师用户ID
	 */
	optimizerUserId: string;
	/**
	 * 省份ID
	 */
	provinceId: string | number;
	/**
	 * 大区销售姓名
	 */
	regionSalesName?: string;
	/**
	 * 大区销售电话
	 */
	regionSalesPhone?: string;
	/**
	 * 大区ID
	 */
	regionId: string;
	/**
	 * 门店代码
	 */
	storeCode: string;
	/**
	 * 门店等级（S/A/B/C/D/NONE=无）
	 */
	storeLevel: string;
	/**
	 * 门店名称
	 */
	storeName: string;
}

/**
 * 新增/编辑经销商门店
 * /dealer/store/saveOrUpdate
 */
export const postDealerStoreSaveOrUpdate = (data: DealerStoreSaveOrUpdate) => {
	return apiClient.post(`${Path}/dealer/store/saveOrUpdate`, data);
};

export interface DealerStoreStatusUpdate {
	/**
	 * 门店ID
	 */
	id: string;
	/**
	 * 经营状态（1=经营，2=退网）
	 */
	storeStatus: number;
	[property: string]: any;
}

/**
 * 经销商门店状态变更
 * /dealer/store/status/update
 */
export const postDealerStoreStatusUpdate = (data: DealerStoreStatusUpdate) => {
	return apiClient.post(`${Path}/dealer/store/status/update`, data);
};

export interface DealerStoreOperationRecordPage {
	/**
	 * 门店ID
	 */
	storeId?: string;
	/**
	 * operatorName 操作人姓名
	 */
	operatorName?: string;
	/**
	 * 操作时间起 (格式：YYYY-MM-DD)
	 */
	operationTimeStart?: string;
	/**
	 * 操作时间止 (格式：YYYY-MM-DD)
	 */
	operationTimeEnd?: string;
	/**
	 * 当前页
	 */
	current?: number;
	/**
	 * 每页条数
	 */
	size?: number;
}
/**
 * 经销商门店操作记录分页查询
 * /dealer/store/operation/record/page
 */
export const postDealerStoreOperationRecordPage = (data: DealerStoreOperationRecordPage) => {
	return apiClient.post(`${Path}/dealer/store/operation/record/page`, data);
};

/**
 * 经销商门店详情
 * /dealer/store/detail
 */
export const postDealerStoreDetail = (data: {
	/**
	 * 查看经销商门店详情的类型：1=经销商门店模块，2=PMO模块，3=优化师模块，4=数据专员模块
	 */
	dealerStoreDetailType: number;
	/**
	 * 门店ID
	 */
	id: string;
}) => {
	return apiClient.post(`${Path}/dealer/store/detail`, data);
};

/**
 * 经销商门店账户导出
 * /dealer/store/account/export
 */
export const postDealerStoreAccountExport = `${Path}/dealer/store/account/export`;

/**
 * 经销商门店导出
 * /dealer/store/export
 */
export const postDealerStoreExport = `${Path}/dealer/store/export`;
