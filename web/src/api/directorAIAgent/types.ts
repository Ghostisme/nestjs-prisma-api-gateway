export interface PolicyOfferItem {
	/*优惠代码 */
	code?: string;
	/*说明文本 */
	description?: string;
}

export interface PresentationRoleItem {
	/*角色（20字以内） */
	role?: string;
	/*角色人数（0-6） */
	count?: number;
}

export interface TaskTypeItem {
	/*任务类型 */
	type?: string;
	/*任务系数 */
	factor?: number;
}
export interface GetScriptListParams {
	/*品牌ID */
	brandId?: number;
	/*子品牌ID */
	subBrandId?: number;
	/*车系ID */
	seriesId?: number;
	/*车型ID */
	modelId?: number;
	/*品牌、子品牌、车系、车型组合。以英文逗号分隔，顺序分别为品牌ID、子品牌ID、车系ID、车型ID */
	brandCombination?: string;
	/*创建人ID */
	creatorId?: number;
	/*呈现形式-谁来讲 */
	presentationForm?: string;
	/*排序字段 */
	orderBy?: string;
	/*排序顺序:1-升序 2-降序,可用值:0,1,2,1, 2 */
	order?: string;
	/*当前页码 */
	page?: number;
	/*分页大小 */
	pageSize?: number;
	/*关键词keyword */
	keyword?: string;
}
export interface GetScriptListRes {
	/*当前页码 */
	pageNumber: number;
	/*当前页码 */
	pageSize: number;
	/*总记录数 */
	total: number;
	/*总页数 */
	totalPages: number;
	/*列表数据 */
	list: {
		/*脚本ID/脚本案例ID */
		id: number;
		/*脚本标题 */
		title: string;
		/*品牌ID */
		brandId: number;
		/*品牌名称 */
		brandName: string;
		/*子品牌ID */
		subBrandId: number;
		/*子品牌名称 */
		subBrandName: string;
		/*车系ID */
		seriesId: number;
		/*车系名称 */
		seriesName: string;
		/*车型ID */
		modelId: number;
		/*车型名称 */
		modelName: string;
		/*脚本类型（含任务类型、任务系数），如: [{"type":"policy_detonation", "factor":1.5}] */
		taskType: Record<string, unknown>[];
		/*购车场景列表 */
		purchaseScenarios: string[];
		/*视频时长 */
		videoDuration: string;
		/*呈现形式-谁来讲 */
		presentationForm: string;
		/*呈现形式-谁来讲-角色对象（含角色、角色人数） */
		presentationRole: Record<string, unknown>[];
		/*呈现形式-在哪拍 */
		shootingLocation: string[];
		/*是否热点 */
		hasHotspot: boolean;
		/*热点描述 */
		hotspotDescription: string;
		/*已采纳方案ID */
		adoptedCaseId: number;
		/*大模型类型 */
		modelType: string;
		/*脚本内容 */
		scriptContent: string;
		/*车型卖点标签 */
		sellingPointTags: string[];
		/*政策优惠列表 */
		policyOffers: {
			/*优惠代码 */
			code: string;

			/*说明文本 */
			description: string;
		}[];
		/*钩子类型 */
		hookType: string;
		/*结尾行动指令 */
		endingAction: string;
		/*创建人ID */
		creatorId: number;
		/*创建人姓名 */
		creatorName: string;
		/*创建时间（时间戳） */
		createTime: number;
		/*更新时间（时间戳） */
		updateTime: number;
	}[];
}
export interface UserListRes {
	/**
	 * 员工名称
	 */
	name: string;
	/**
	 * 员工ID
	 */
	userId: number;
}
export interface BrandRes {
	/* */
	id: number;
	/* */
	name: string;
	/* */
	url: string;
	/* */
	desc: string;
	/* */
	createTime: number;
	/* */
	createUser: string;
	/* */
	subBrandNames: string;
}
export interface GetBrandSeriesModelRes {
	/* */
	subBrandId: number;
	/* */
	subBrandName: string;
	/*车系列表 */
	seriesList: {
		/* */
		seriesId: number;
		/* */
		seriesName: string;
		/*车型列表 */
		carModels: {
			/* */
			carId: number;
			/* */
			carName: string;
			/*是否禁用 */
			disabled: boolean;
		}[];
	}[];
}
export interface EditScriptCaseContentParams {
	/*脚本案例ID */
	caseId: number;
	/*脚本内容 */
	scriptContent: string;
}
export interface SellingPointListParams {
	/*品牌ID */
	brandId?: number;
	/*子品牌ID */
	subBrandId?: number;
	/*车系ID */
	seriesId?: number;
	/*车型ID */
	modelId?: number;
	/*品牌、子品牌、车系、车型组合。以英文逗号分隔，顺序分别为品牌ID、子品牌ID、车系ID、车型ID */
	brandCombination?: string;
	/*排序字段 */
	orderBy?: string;
	/*排序顺序:1-升序 2-降序,可用值:0,1,2,1, 2 */
	order?: string;
	/*当前页码 */
	page?: number;
	/*分页大小 */
	pageSize?: number;
	/*关键词keyword */
	keyword?: string;
}
export interface SellingPointListRes {
	/*当前页码 */
	pageNumber: number;
	/*当前页码 */
	pageSize: number;
	/*总记录数 */
	total: number;
	/*总页数 */
	totalPages: number;
	/*列表数据 */
	list: {
		/*主键ID */
		id: number;
		/*品牌ID */
		brandId: number;
		/*品牌名称 */
		brandName: string;
		/*子品牌ID */
		subBrandId: number;
		/*子品牌名称 */
		subBrandName: string;
		/*车系ID */
		seriesId: number;
		/*车系名称 */
		seriesName: string;
		/*车型ID */
		modelId: number;
		/*车型名称 */
		modelName: string;
		/*卖点标签列表 */
		tags: {
			/*标签ID */
			id: number;

			/*标签名称 */
			name: string;
		}[];
		/*创建时间 */
		createTime: number;
		/*更新时间 */
		updateTime: number;
	}[];
}
export interface CreateParams {
	/*品牌ID */
	brandId?: number;
	/*子品牌、车系、车型组合。以英文逗号分隔，顺序分别为子品牌ID、车系ID、车型ID */
	brandCombination: string;
	/*子品牌ID */
	subBrandId?: number;
	/*车系ID */
	seriesId?: number;
	/*车型ID */
	modelId?: number;
	/*卖点标签列表 */
	tags: string[];
}
export interface ApplyScriptParams {
	/*品牌ID */
	brandId: number;
	/*子品牌、车系、车型组合。以英文逗号分隔，顺序分别为子品牌ID、车系ID、车型ID */
	brandCombination?: string;
	/*子品牌ID */
	subBrandId: number;
	/*车系ID */
	seriesId: number;
	/*车型ID */
	modelId?: number;
	/*脚本类型（含任务类型、任务系数），如: [{"type":"policy_detonation", "factor":1.5}] */
	taskType?: TaskTypeItem[];
	/*购车场景（最多3个） */
	purchaseScenarios?: string[];
	/*视频时长 */
	videoDuration?: string;
	/*呈现形式-谁来讲 */
	presentationForm?: string;
	/*呈现形式-谁来讲-角色对象（含角色、角色人数，最多5个） */
	presentationRole?: PresentationRoleItem[];
	/*呈现形式-在哪拍（总共不超过5个地点，包括固定和自定义选项，自定义地址20个字以内） */
	shootingLocation?: string[];
	/*呈现形式-有无热点 */
	hasHotspot?: boolean;
	/*热点描述（当hasHotspot为true时有效） */
	hotspotDescription?: string;
	/*车型卖点标签（最多20个） */
	sellingPointTags?: string[];
	/*政策优惠 */
	policyOffers?: PolicyOfferItem[];
	/*钩子类型 */
	hookType?: string;
	/*结尾行动指令 */
	endingAction?: string;
	/*结尾行动描述 */
	endingActionDesc?: string;
	/*地域 */
	region?: string;
	/* 采访核心维度 */
	interviewCoreDimension?: string;
	/* 剧情节奏 */
	plotRhythm?: string;
	/* 口播风格 */
	broadcastStyle?: string;
}
export interface SellingPointDetailRes {
	id: number;
	brandId: number;
	brandName: string;
	subBrandId: number;
	subBrandName: string;
	seriesId: number;
	seriesName: string;
	modelId: number;
	modelName: string;
	tags: {
		id: number;
		name: string;
	}[];
	createTime: number;
	updateTime: number;
}
export interface ScriptAiListRes {
	id: number;
	title: string;
	status: string;
	modelType: string;
	scriptContent: string;
	hasSensitiveWord: boolean;
	sensitiveWords: any;
}
export interface ScriptCaseStatusResponse {
	hasSensitiveWord?: boolean;
	id?: number;
	modelType?: string;
	scriptContent?: string;
	sensitiveWords?: string[];
	status?: string;
	title?: string;
	[property: string]: any;
}
export interface AiScriptContentParams {
	caseId: number;
	scriptContent: string;
}
export type AiScriptDetailRes = GetScriptListRes["list"][number];
export interface ConfigListRes {
	configId: number;
	contentType: number;
	configName: string;
	personConfig: any;
	shootingScene: string[];
	/*用车场景 */
	purchaseScenarios: string[];
	exclusiveRights: string[];
	policyTrigger: number;
	productSeeding: number;
	videoDuration: string[];
	interviewDimension: any[];
	plotRhythm: any[];
	broadcastStyle: string[];
	selectedArea: any;
	createTime: number;
	updateTime: number;
}

export interface AreaTreeVO {
	abbreviation?: string;
	children?: AreaTreeVO[];
	countryType?: number;
	id?: number;
	name?: string;
	originalId?: number;
	parentOriId?: number;
	type?: number;
	[property: string]: any;
}
