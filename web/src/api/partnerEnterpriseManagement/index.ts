import apiClient from "@/api/apiClient";
import type {
	AvailableMenuListRequest,
	BrandInfoResponse,
	PageTenantPageVO,
	TenantDetailInfoVO,
	TenantMenuAndAIInfoVO,
	TenantPageQueryRequest,
	TenantSaveRequest,
	TenantUserRoleListRequest,
	TenantUserResetPasswordResponse,
	TenantUserSaveRequest,
	TenantUserSaveResponse,
	TenantUserUpdateRequest,
	TenantUserDetailVO,
	TenantUserRoleOption,
	TenantUpdateRequest,
} from "./types";

const PARTNER_ENTERPRISE_MANAGEMENT_API = {
	Page: "admin/tenant/page",
	Save: "admin/tenant/save",
	Update: "admin/tenant/update",
	Delete: "admin/tenant",
	Detail: "admin/tenant/details",
	Enable: "admin/tenant/enable",
	Disable: "admin/tenant/disable",
	TenantUserSave: "admin/tenant/user/adminSave",
	TenantUserRoleList: "admin/tenant/user/roleList",
	BrandList: "/xdwx-material/v1/brand/list",
	AvailableMenuList: "admin/tenant/availableMenuList",
	TenantUserAdminDetails: "admin/tenant/user/adminDetails",
	TenantUserAdminUpdate: "admin/tenant/user/adminUpdate",
	TenantUserAdminResetPassword: "admin/tenant/user/adminResetPassword",
} as const;

/**
 * 分页查询合作商
 */
export const postPartnerEnterprisePage = (data: TenantPageQueryRequest) => {
	return apiClient.post<PageTenantPageVO>(PARTNER_ENTERPRISE_MANAGEMENT_API.Page, data);
};

/**
 * 新增合作商
 */
export const createPartnerEnterprise = (data: TenantSaveRequest) => {
	return apiClient.post<boolean>(PARTNER_ENTERPRISE_MANAGEMENT_API.Save, data);
};

/**
 * 修改合作商
 */
export const updatePartnerEnterprise = (data: TenantUpdateRequest) => {
	return apiClient.put<boolean>(PARTNER_ENTERPRISE_MANAGEMENT_API.Update, data);
};

/**
 * 新增合作商用户
 */
export const createPartnerEnterpriseUser = (data: TenantUserSaveRequest) => {
	return apiClient.post<TenantUserSaveResponse>(PARTNER_ENTERPRISE_MANAGEMENT_API.TenantUserSave, data);
};

/**
 * 获取合作商企业账号详情
 *
 * 获取合作商用户详情-超级管理员
 */
export const getPartnerEnterpriseUserDetail = (tenantId: number) => {
	return apiClient.get<TenantUserDetailVO>(`${PARTNER_ENTERPRISE_MANAGEMENT_API.TenantUserAdminDetails}/${tenantId}`);
};

/**
 * 修改合作商企业账号
 *
 * 编辑合作商用户-超级管理员
 */
export const updatePartnerEnterpriseUser = (data: TenantUserUpdateRequest) => {
	return apiClient.put<TenantUserSaveResponse>(PARTNER_ENTERPRISE_MANAGEMENT_API.TenantUserAdminUpdate, data);
};

/**
 * 重置合作商企业账号密码
 *
 * 重置合作商用户密码-超级管理员
 */
export const resetPartnerEnterpriseUserPassword = (tenantId: number) => {
	return apiClient.put<TenantUserResetPasswordResponse>(
		`${PARTNER_ENTERPRISE_MANAGEMENT_API.TenantUserAdminResetPassword}/${tenantId}`,
	);
};

/**
 * 根据合作商ID查询角色信息
 */
export const getPartnerEnterpriseUserRoleList = (params: TenantUserRoleListRequest) => {
	return apiClient.get<TenantUserRoleOption[]>(PARTNER_ENTERPRISE_MANAGEMENT_API.TenantUserRoleList, {
		params,
	});
};

/**
 * 删除合作商
 */
export const deletePartnerEnterprise = (id: number) => {
	return apiClient.delete<boolean>(`${PARTNER_ENTERPRISE_MANAGEMENT_API.Delete}/${id}`);
};

/**
 * 获取合作商详情
 */
export const getPartnerEnterpriseDetail = (id: number) => {
	return apiClient.get<TenantDetailInfoVO>(`${PARTNER_ENTERPRISE_MANAGEMENT_API.Detail}/${id}`);
};

/**
 * 获取合作品牌下拉列表
 */
export const getPartnerBrandList = () => {
	return apiClient.get<BrandInfoResponse[]>(PARTNER_ENTERPRISE_MANAGEMENT_API.BrandList);
};

/**
 * 获取合作商可用后台菜单树
 */
export const getPartnerAvailableMenuList = (params: AvailableMenuListRequest) => {
	return apiClient.get<TenantMenuAndAIInfoVO>(PARTNER_ENTERPRISE_MANAGEMENT_API.AvailableMenuList, {
		params,
	});
};

/**
 * 启用合作商
 */
export const enablePartnerEnterprise = (id: number) => {
	return apiClient.put<boolean>(`${PARTNER_ENTERPRISE_MANAGEMENT_API.Enable}/${id}`);
};

/**
 * 禁用合作商
 */
export const disablePartnerEnterprise = (id: number) => {
	return apiClient.put<boolean>(`${PARTNER_ENTERPRISE_MANAGEMENT_API.Disable}/${id}`);
};

export type {
	AiCapabilityVO,
	AvailableMenuListRequest,
	BrandInfoResponse,
	MenuSimpleTreeVO,
	OrderItem,
	PageTenantPageVO,
	TenantBusinessMenuDTO,
	TenantDetailInfoVO,
	TenantMenuAndAIInfoVO,
	TenantPageQueryRequest,
	TenantPageResponse,
	TenantPageVO,
	TenantSaveRequest,
	TenantUserDetailVO,
	TenantUserResetPasswordResponse,
	TenantUserRoleListRequest,
	TenantUserRoleOption,
	TenantUserSaveRequest,
	TenantUserSaveResponse,
	TenantUserUpdateRequest,
	TenantUpdateRequest,
} from "./types";
