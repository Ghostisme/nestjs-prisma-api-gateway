export interface BrandPageRequest {
	/**
	 * 品牌对接人（模糊查询）
	 */
	brandContact?: string;
	/**
	 * 品牌名称（模糊查询）
	 */
	brandName?: string;
	/**
	 * 品牌状态（精准查询）
	 */
	brandStatus?: number;
	countId?: string;
	current?: number;
	/**
	 * 数据专员（模糊查询）
	 */
	dataSpecialist?: string;
	/**
	 * 加入结束时间
	 */
	joinEndTime?: string;
	/**
	 * 加入开始时间
	 */
	joinStartTime?: string;
	maxLimit?: number;
	optimizeCountSql?: boolean;
	optimizeJoinOfCountSql?: boolean;
	/**
	 * 所属大区（模糊查询）
	 */
	regionName?: string;
	searchCount?: boolean;
	size?: number;
	total?: number;
	[property: string]: any;
}

export interface CommunityInfo {
	regionName: string;
	community?: string;
	[property: string]: any;
}

export interface BrandSaveRequest {
	/**
	 * 品牌介绍（最多三百个字符，必填）
	 */
	brandIntro: string;
	/**
	 * 品牌logo（绝对路径）
	 */
	brandLogo?: string;
	/**
	 * 品牌名称（最多三十个字符，必填）
	 */
	brandName: string;
	/**
	 * PMOID
	 * 品牌对接人
	 */
	pmoId: number;
	/**
	 * PMO名称
	 * 品牌对接人名称
	 */
	pmoName: string;
	/**
	 * 品牌大区（可以多选）
	 */
	communityInfos?: CommunityInfo[];
	/**
	 * 数据专员ID
	 */
	specialistId: number;
	/**
	 * 数据专员名称
	 */
	specialistName: string;
	[property: string]: any;
}

export interface BrandUpdateRequest {
	/**
	 * 品牌ID
	 */
	brandId: number;
	/**
	 * 品牌介绍（最多三百个字符，必填）
	 */
	brandIntro: string;
	/**
	 * 品牌logo（绝对路径）
	 */
	brandLogo?: string;
	/**
	 * 品牌名称（最多三十个字符，必填）
	 */
	brandName: string;
	/**
	 * PMOID
	 * 品牌对接人
	 */
	pmoId: number;
	/**
	 * PMO名称
	 * 品牌对接人名称
	 */
	pmoName: string;
	/**
	 * 品牌大区（可以多选）
	 */
	communityInfos: CommunityInfo[];
	/**
	 * 数据专员ID
	 */
	specialistId: number;
	/**
	 * 数据专员名称
	 */
	specialistName: string;
}

export interface BrandDetailsRequest {
	/**
	 * 品牌ID
	 */
	brandId: number;
}

export interface BrandExportRequest {
	/**
	 * 品牌对接人（模糊查询）
	 */
	brandContact?: string;
	/**
	 * 品牌名称（模糊查询）
	 */
	brandName?: string;
	/**
	 * 品牌状态（精准查询）
	 */
	brandStatus?: number;
	countId?: string;
	current?: number;
	/**
	 * 数据专员（模糊查询）
	 */
	dataSpecialist?: string;
	/**
	 * 加入结束时间
	 */
	joinEndTime?: string;
	/**
	 * 加入开始时间
	 */
	joinStartTime?: string;
	maxLimit?: number;
	optimizeCountSql?: boolean;
	optimizeJoinOfCountSql?: boolean;
	records?: any[];
	/**
	 * 所属大区（模糊查询）
	 */
	regionName?: string;
	searchCount?: boolean;
	size?: number;
	total?: number;
}

export interface BrandOfflineRequest {
	/**
	 * 品牌ID
	 */
	brandId: number;
}

export interface BrandRegionDeleteRequest {
	/**
	 * 品牌ID
	 */
	brandId: number;
	/**
	 * 大区ID
	 */
	regionId: number;
}

export interface BrandLogsRequest {
	/**
	 * 品牌ID
	 */
	brandId?: number;
	/**
	 * 操作人名称
	 */
	createByName?: string;
	/**
	 * 操作结束时间
	 */
	endTime?: string;
	/**
	 * 操作开始时间
	 */
	startTime?: string;
	current?: number;
	size?: number;
}

export interface BrandGetRegionsRequest {
	/**
	 * 品牌ID
	 */
	brandId: number | string | unknown;
}

export interface BrandContactListRequest {
	/**
	 * 联系邮箱
	 */
	email?: string;
	/**
	 * 姓名
	 */
	name?: string;
	/**
	 * 联系电话
	 */
	phone?: string;
	/**
	 * 角色编码
	 */
	roleCode: string;
}

export interface ModelPageRequest {
	/**
	 * 所属品牌ID
	 */
	brandId?: number;
	/**
	 * 所属品牌名称（模糊查询）
	 */
	brandName?: string;
	/**
	 * countId
	 */
	countId?: string;
	/**
	 * 当前页
	 */
	current?: number;
	/**
	 * 加入结束时间
	 */
	joinEndTime?: string;
	/**
	 * 加入开始时间
	 */
	joinStartTime?: string;
	/**
	 * 单页分页条数限制
	 */
	maxLimit?: number;
	/**
	 * 车型名称（模糊查询）
	 */
	modelName?: string;
	/**
	 * 车型类型：1-指定车型，2-全国，3-区域
	 */
	modelType?: number;
	/**
	 * 自动优化 COUNT SQL
	 */
	optimizeCountSql?: boolean;
	/**
	 * {@link #optimizeJoinOfCountSql()}
	 */
	optimizeJoinOfCountSql?: boolean;
	/**
	 * 排序字段信息
	 */
	// orders?: OrderItem[];
	/**
	 * 查询数据列表
	 */
	records?: { [key: string]: any }[];
	/**
	 * 是否进行 count 查询
	 */
	searchCount?: boolean;
	/**
	 * 每页显示条数，默认 10
	 */
	size?: number;
	/**
	 * 总数
	 */
	total?: number;
}

export interface BrandModelSaveRequest {
	/**
	 * 品牌ID
	 */
	brandId: number;
	/**
	 * 车型名称（指定车型必填）
	 */
	modelName?: string;
	/**
	 * 车型类型：1-指定车型，2-全国，3-区域
	 */
	modelType: number;
	/**
	 * 指定车型ID
	 */
	specificModelId?: number;
}

// 品牌列表数据
export interface BrandInfo {
	brandId: string;
	brandLogo: string;
	// brandLogoId: number;
	brandName: string;
	brandIntro: string;
	createTime: string;
	createUser: string;
	subBrandNames: string;
}

// 品牌关联数据
export interface SubBrandItem {
	brandId: number;
	brandName: string;
	subBrandName: string;
}

// 品牌创建请求
export interface CreateSaveBrandRequest {
	brandName: string;
	brandLogo: string;
	brandIntro: string;
	subBrandIds: number[];
}

export interface UpdateSaveBrandRequest extends CreateSaveBrandRequest {
	id: number;
}
