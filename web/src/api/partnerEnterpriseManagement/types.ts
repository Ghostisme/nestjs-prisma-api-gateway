/**
 * 分页查询参数
 *
 * TenantPageQueryDTO
 * com.tdkj.platform.admin.api.dto.TenantPageQueryDTO
 */
export interface TenantPageQueryRequest {
	/**
	 * 品牌ID
	 */
	brandId?: number;
	countId?: string;
	current?: number;
	maxLimit?: number;
	/**
	 * 合作商名称
	 */
	name?: string;
	optimizeCountSql?: boolean;
	optimizeJoinOfCountSql?: boolean;
	orders?: OrderItem[];
	records?: TenantPageQueryRequest[];
	searchCount?: boolean;
	size?: number;
	/**
	 * 企业状态
	 */
	status?: number;
	/**
	 * 租户ID
	 */
	tenantId?: number;
	total?: number;
	[property: string]: unknown;
}

/**
 * 品牌列表结果
 *
 * RListBrandInfoResponse
 */
export interface BrandListResponse {
	code?: number;
	data?: BrandInfoResponse[];
	msg?: string;
	[property: string]: unknown;
}

/**
 * 品牌信息
 *
 * com.xdwx.material.api.response.brand.BrandInfoResponse
 */
export interface BrandInfoResponse {
	/**
	 * 品牌ID
	 */
	brandId?: number;
	/**
	 * 品牌介绍
	 */
	brandIntro?: string;
	/**
	 * 品牌Logo
	 */
	brandLogo?: string;
	/**
	 * 品牌名称
	 */
	brandName?: string;
	/**
	 * 创建时间
	 */
	createTime?: number;
	/**
	 * 创建人
	 */
	createUser?: string;
	/**
	 * 子品牌名称
	 */
	subBrandNames?: string;
	[property: string]: unknown;
}

/**
 * 查询所有可用菜单及目录-树形（不包含按钮）参数
 *
 * TenantAvailableMenuListRequest
 */
export interface AvailableMenuListRequest {
	/**
	 * 业务标识
	 */
	businessCode: string;
	/**
	 * 租户ID
	 */
	tenantId?: number;
	[property: string]: unknown;
}

/**
 * 可用菜单和 AI 能力结果
 *
 * TenantMenuAndAIInfoVO
 */
export interface TenantMenuAndAIInfoVO {
	/**
	 * AI能力集合
	 */
	aiInfoList?: AiCapabilityVO[];
	/**
	 * 菜单信息
	 */
	menuList?: MenuSimpleTreeVO[];
	[property: string]: unknown;
}

/**
 * AI 能力信息
 *
 * com.tdkj.platform.admin.api.vo.ai.AiCapabilityVO
 */
export interface AiCapabilityVO {
	/**
	 * AI能力编码
	 */
	aiCode?: number;
	/**
	 * AI能力名称
	 */
	name?: string;
	/**
	 * 是否选择 0：否 1：是
	 */
	selected?: number;
	[property: string]: unknown;
}

/**
 * 合作商后台功能参数
 *
 * TenantBusinessMenuDTO
 */
export interface TenantBusinessMenuDTO {
	/**
	 * AI功能列表，详见 TenantAiFunctionEnum
	 */
	aiCodeList?: number[];
	/**
	 * 产品功能编码，详见 TenantProductFunctionEnum
	 */
	businessCode: string;
	/**
	 * 菜单code列表
	 */
	menuCodeList: number[];
	[property: string]: unknown;
}

/**
 * 合作商保存参数
 *
 * TenantSaveDTO
 */
export interface TenantSaveRequest {
	/**
	 * 品牌 ID
	 */
	brandId: number;
	/**
	 * 产品功能列表，详见 TenantProductFunctionEnum
	 */
	businessList: string[];
	/**
	 * 后台功能列表
	 */
	functions?: TenantBusinessMenuDTO[];
	/**
	 * 合作商名称
	 */
	name: string;
	/**
	 * 负责人联系电话
	 */
	phone?: string;
	/**
	 * 合作企业负责人
	 */
	principal?: string;
	/**
	 * 合作企业状态 0:启用 1:禁用
	 */
	status?: number;
	[property: string]: unknown;
}

/**
 * 合作商更新参数
 *
 * TenantUpdateDTO
 */
export interface TenantUpdateRequest {
	/**
	 * 品牌 ID
	 */
	brandId: number;
	/**
	 * 产品功能列表，详见 TenantProductFunctionEnum
	 */
	businessList: string[];
	/**
	 * 后台功能列表
	 */
	functions: TenantBusinessMenuDTO[];
	/**
	 * 合作商 ID
	 */
	id: number;
	/**
	 * 合作商名称
	 */
	name: string;
	/**
	 * 负责人联系电话
	 */
	phone?: string;
	/**
	 * 合作企业负责人
	 */
	principal?: string;
	/**
	 * 合作企业状态 0:启用 1:禁用
	 */
	status?: number;
	[property: string]: unknown;
}

/**
 * 合作商用户新增参数
 *
 * TenantUserAddDTO
 */
export interface TenantUserSaveRequest {
	/**
	 * 确认密码
	 */
	confirmPassword: string;
	/**
	 * 联系邮箱
	 */
	email?: string;
	/**
	 * 姓名
	 */
	name: string;
	/**
	 * 密码
	 */
	password: string;
	/**
	 * 联系电话
	 */
	phone?: string;
	/**
	 * 用户状态，0：禁用，1：启用
	 */
	status: number;
	/**
	 * 租户ID
	 */
	tenantId: number;
	/**
	 * 用户名（手机号）
	 */
	username: string;
	[property: string]: unknown;
}

/**
 * 合作商用户详情
 *
 * TenantUserDetailVO
 */
export interface TenantUserDetailVO {
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
	 * 所属角色
	 */
	roleName?: string;
	/**
	 * 用户状态，0：禁用，1：启用，字符串信息在statusName中
	 */
	status?: number;
	/**
	 * 用户ID
	 */
	userId?: number;
	/**
	 * 用户名（手机号）
	 */
	username?: string;
	[property: string]: unknown;
}

/**
 * 合作商用户更新参数
 *
 * TenantAIUserEditDTO
 */
export interface TenantUserUpdateRequest {
	/**
	 * 联系邮箱
	 */
	email?: string;
	/**
	 * 姓名
	 */
	name: string;
	/**
	 * 联系电话
	 */
	phone: string;
	/**
	 * 用户状态，0：禁用，1：启用
	 */
	status: number;
	/**
	 * 租户ID
	 */
	tenantId: number;
	/**
	 * 兜底扩展字段
	 */
	[property: string]: unknown;
}

/**
 * 根据合作商ID查询角色信息参数
 *
 * TenantUserRoleListQueryDTO
 */
export interface TenantUserRoleListRequest {
	/**
	 * 租户ID
	 */
	tenantId: number;
	[property: string]: unknown;
}

/**
 * 合作商用户角色信息
 *
 * TenantUserRoleVO
 */
export interface TenantUserRoleOption {
	/**
	 * 角色ID
	 */
	roleId: number;
	/**
	 * 角色名称
	 */
	roleName: string;
	[property: string]: unknown;
}

/**
 * 合作商用户保存/更新结果
 *
 * RBoolean
 */
export interface TenantUserSaveResponse {
	code?: number;
	data?: boolean;
	msg?: string;
	[property: string]: unknown;
}

/**
 * 重置合作商用户密码结果
 *
 * RString
 */
export interface TenantUserResetPasswordResponse {
	code?: number;
	data?: string;
	msg?: string;
	[property: string]: unknown;
}

/**
 * com.baomidou.mybatisplus.core.metadata.OrderItem
 *
 * OrderItem
 */
export interface OrderItem {
	asc?: boolean;
	column?: string;
	[property: string]: unknown;
}

/**
 * 分页结果
 *
 * RPageTenantPageVO
 */
export interface TenantPageResponse {
	code?: number;
	data?: PageTenantPageVO;
	msg?: string;
	[property: string]: unknown;
}

/**
 * PageTenantPageVO
 */
export interface PageTenantPageVO {
	countId?: string;
	current?: number;
	maxLimit?: number;
	optimizeCountSql?: boolean;
	optimizeJoinOfCountSql?: boolean;
	orders?: OrderItem[];
	records?: TenantPageVO[];
	searchCount?: boolean;
	size?: number;
	total?: number;
	[property: string]: unknown;
}

/**
 * com.tdkj.platform.admin.api.vo.TenantPageVO
 *
 * TenantPageVO
 */
export interface TenantPageVO {
	/**
	 * 品牌ID
	 */
	brandId?: number;
	/**
	 * 合作品牌
	 */
	brandName?: string;
	/**
	 * 合作商 id
	 */
	id?: number;
	/**
	 * 加入时间
	 */
	joinTime?: string;
	/**
	 * 合作商名称
	 */
	name?: string;
	/**
	 * 合作商状态 0：启用 1：正常
	 */
	status?: number;
	/**
	 * 合作商用户数
	 */
	userNumber?: string;
	[property: string]: unknown;
}

/**
 * com.tdkj.platform.admin.api.vo.MenuSimpleTreeVO
 *
 * MenuSimpleTreeVO
 */
export interface MenuSimpleTreeVO {
	/**
	 * 子集权限
	 */
	children?: MenuSimpleTreeVO[];
	/**
	 * 角色是否选中该权限 0未选中，1已选中
	 */
	hasPermission?: number;
	/**
	 * 权限code值
	 */
	menuCode?: string;
	/**
	 * 权限ID
	 */
	menuId?: number;
	/**
	 * 权限名称
	 */
	menuName?: string;
	/**
	 * 父级ID
	 */
	parentId?: number;
	/**
	 * 权限唯一code值
	 */
	permissionCode?: number;
	/**
	 * 排序值
	 */
	sortOrder?: number;
	[property: string]: unknown;
}

/**
 * 合作商详情信息
 *
 * TenantDetailInfoVO
 */
export interface TenantDetailInfoVO {
	/**
	 * 品牌 ID
	 */
	brandId?: number;
	/**
	 * 合作品牌
	 */
	brandName?: string;
	/**
	 * 已开放功能列表
	 */
	functions?: MenuSimpleTreeVO[];
	/**
	 * 合作商 ID
	 */
	id?: number;
	/**
	 * 合作商名称
	 */
	name?: string;
	/**
	 * 负责人联系电话
	 */
	phone?: string;
	/**
	 * 合作企业负责人
	 */
	principal?: string;
	/**
	 * 合作企业状态 0:启用 1:禁用
	 */
	status?: number;
	[property: string]: unknown;
}
