import apiClient from "../apiClient";
import type { CommonList } from "../types";
import { uploadService } from "../upload";

export enum DeptManagementApi {
	Page = "/admin/dept/page",
	Export = "/admin/dept/export",
	Users = "/admin/dept/users",
	UsersExport = "/admin/dept/users/export",
}

export type DeptPageParams = {
	page?: number;
	pageSize?: number;
	deptName?: string;
	[key: string]: unknown;
};

export type DeptRecord = {
	deptId: number;
	deptIdName: string;
	deptName: string;
	deptLeader: string;
	leaderPhone: string;
	sortOrder: number;
	userCount: number;
	updateTime: string;
};

export type DeptPageResponse = {
	code: number;
	msg: string;
	data: {
		records: DeptRecord[];
		total: number;
		size: number;
		current: number;
		pages?: number;
	};
};

export type DeptUsersPageParams = {
	deptId: number;
	page?: number;
	pageSize?: number;
	[key: string]: unknown;
};

export type DeptUserRecord = {
	userId: number;
	name: string;
	roleName?: string;
	phone: string;
	email: string;
	status: number;
	createTime: string;
};

const toBackendParams = (params: DeptPageParams) => {
	const { page, pageSize, ...rest } = params ?? {};
	return {
		current: page,
		size: pageSize,
		...rest,
	};
};

const getDeptPage = (params?: DeptPageParams) =>
	apiClient.post<DeptPageResponse>(DeptManagementApi.Page, toBackendParams(params ?? {}));

const exportDeptList = (params?: DeptPageParams) =>
	uploadService.download(DeptManagementApi.Export, toBackendParams(params ?? {}));

const toUsersBackendParams = (params: DeptUsersPageParams) => {
	const { page, pageSize, ...rest } = params ?? {};
	return {
		current: page,
		size: pageSize,
		...rest,
	};
};

const getDeptUsersPage = (params: DeptUsersPageParams) =>
	apiClient.post<CommonList<DeptUserRecord>>(DeptManagementApi.Users, toUsersBackendParams(params));

const exportDeptUsers = (params: DeptUsersPageParams) =>
	uploadService.download(DeptManagementApi.UsersExport, toUsersBackendParams(params));

export default {
	getDeptPage,
	exportDeptList,
	getDeptUsersPage,
	exportDeptUsers,
};
