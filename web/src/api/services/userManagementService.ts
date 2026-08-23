import type { DeptInfo, PostInfo, RoleInfo } from "@/pages/sys-account-management/user-management/types";
import apiClient from "../apiClient";

export enum UserManagementApi {
	Page = "/admin/account/page",
	Details = "/admin/account/details",
	Save = "/admin/account/save",
	Update = "/admin/account/update",
	Disable = "/admin/account/disable",
	Enable = "/admin/account/enable",
	ResetPassword = "/admin/account/resetPassword",
	DeptInfo = "/admin/dept/info",
	AiCapabilitySimpleList = "/admin/ai/capability/simpleList",
}

export type UserPageParams = Record<string, unknown>;

export type UserDetails = {
	userId: number;
	username: string;
	name: string;
	deptId: number;
	roleId: number;
	phone: string;
	deptName: string;
	roleName: string;
	email: string;
	headImg: string;
	status: number;
	statusName: string;

	deptList: DeptInfo[];
	roleList: RoleInfo[];
	postList: PostInfo[];
	capabilityCodes?: number[];
};

export type UserSaveParams = {
	username: string;
	password: string;
	confirmPassword: string;
	name: string;
	deptIds: string[];
	roleIds: string[];
	phone: string;
	email: string;
	status: number;
	capabilityCodes: number[];
};

export type UserUpdateParams = UserSaveParams & {
	userId: number;
};

export type DeptInfoNode = {
	deptId: number;
	deptName: string;
	parentId: number;
	children?: DeptInfoNode[];
};

export interface DictSimpleVO {
	label?: string;
	value?: string;
}

const getUserPage = (params?: UserPageParams) => apiClient.post(UserManagementApi.Page, params ?? {});

const getUserDetails = (userId: number) => apiClient.get<UserDetails>(`${UserManagementApi.Details}/${userId}`);

const saveUser = (data: UserSaveParams) => apiClient.post(UserManagementApi.Save, data);

const updateUser = (data: UserUpdateParams) => apiClient.put(UserManagementApi.Update, data);

const disableUser = (userId: number) => apiClient.put(`${UserManagementApi.Disable}/${userId}`);

const enableUser = (userId: number) => apiClient.put(`${UserManagementApi.Enable}/${userId}`);

const resetPassword = (userId: number) => apiClient.put(`${UserManagementApi.ResetPassword}/${userId}`);

const getDeptInfo = () => apiClient.post<DeptInfoNode[]>(UserManagementApi.DeptInfo, {});

const getAiCapabilitySimpleList = () => apiClient.get<DictSimpleVO[]>(UserManagementApi.AiCapabilitySimpleList);

export default {
	getUserPage,
	getUserDetails,
	saveUser,
	updateUser,
	disableUser,
	enableUser,
	resetPassword,
	getDeptInfo,
	getAiCapabilitySimpleList,
};
