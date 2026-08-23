import apiClient from "../apiClient";
import type { CommonList } from "../types";

export enum RoleManagementApi {
	Page = "/admin/role/common/page",
	SimpleAll = "/admin/role/common/simpleAll",
	RoleMenus = "/admin/role/common/roleMenus",
	AgentGroupList = "/admin/ai/agent/groupList",
	Details = "/admin/role/common/details",
	Enable = "/admin/role/common/enable",
	Disable = "/admin/role/common/disable",
	Save = "/admin/role/common/save",
	Update = "/admin/role/common/update",
}

/** 角色菜单树节点（接口 /roleMenus 返回） */
export type RolePermissionNode = {
	permissionId: number;
	parentId: number;
	permissionName: string;
	hasPermission: number;
	visible: string;
	children: RolePermissionNode[];
};

export type RolePageParams = {
	page?: number;
	pageSize?: number;
	roleName?: string;
	status?: number;
	[key: string]: unknown;
};

export type RoleRecord = {
	roleId: number;
	roleName: string;
	roleDesc: string;
	status: number;
	createTime: string;
};

export type RoleSimpleRecord = {
	roleId: number;
	roleName: string;
};

export type RoleDetails = {
	roleId: number;
	roleName: string;
	roleDesc: string;
	status: number;
	dataType: number;
	menuIds: number[];
};

export interface TenantAiAgentGroupListParams {
	roleId?: number;
	[key: string]: unknown;
}

export interface TenantAiAgentVO {
	/** 智能体编码 */
	agentCode?: number;
	/** 智能体简介 */
	agentIntro?: string;
	/** 智能体Logo */
	agentLogo?: string;
	/** 智能体名称 */
	agentName?: string;
	/** AI能力编码 */
	aiCapabilityCode?: number;
	/** 智能体ID */
	id?: number;
	/** 是否选中 0：否 1：是 */
	selected?: number;
	[key: string]: unknown;
}

export interface TenantAiAgentGroupVO {
	/** 智能体列表 */
	agentList?: TenantAiAgentVO[];
	/** AI能力编码 */
	aiCode?: number;
	/** AI能力英文编码 */
	aiEnCode?: string;
	/** AI能力名称 */
	name?: string;
	/** 是否选中 0：否 1：是 */
	selected?: number;
	[key: string]: unknown;
}

export type RoleSaveParams = {
	roleName: string;
	roleDesc: string;
	status: number;
	dataType: number;
	menuIds: number[];
	agentCodes: number[];
};

export type RoleUpdateParams = RoleSaveParams & {
	roleId: number;
};

const toBackendParams = (params: RolePageParams) => {
	const { page = 1, pageSize = 10, ...rest } = params ?? {};
	return {
		current: page,
		size: pageSize,
		...rest,
	};
};

const getRolePage = (params?: RolePageParams) =>
	apiClient.post<CommonList<RoleRecord>>(RoleManagementApi.Page, toBackendParams(params ?? {}));

const getRoleSimpleAll = () => apiClient.get<RoleSimpleRecord[]>(RoleManagementApi.SimpleAll);

const getRoleMenus = (roleId?: number) =>
	apiClient.get<RolePermissionNode[]>(RoleManagementApi.RoleMenus, {
		params: roleId ? { roleId } : undefined,
	});

const getAgentGroupList = (params?: TenantAiAgentGroupListParams) =>
	apiClient.get<TenantAiAgentGroupVO[]>(RoleManagementApi.AgentGroupList, {
		params,
	});

const getRoleDetails = (roleId: number) => apiClient.get<RoleDetails>(`${RoleManagementApi.Details}/${roleId}`);

const enableRole = (roleId: number) => apiClient.put(`${RoleManagementApi.Enable}/${roleId}`);
const disableRole = (roleId: number) => apiClient.put(`${RoleManagementApi.Disable}/${roleId}`);
const saveRole = (data: RoleSaveParams) => apiClient.post(RoleManagementApi.Save, data);
const updateRole = (data: RoleUpdateParams) => apiClient.put(RoleManagementApi.Update, data);

export default {
	getRolePage,
	getRoleSimpleAll,
	getRoleMenus,
	getAgentGroupList,
	getRoleDetails,
	enableRole,
	disableRole,
	saveRole,
	updateRole,
};
