import type { UserInfo, UserInfoFromApi } from "#/entity";
import apiClient from "../apiClient";

const OAUTH_BASIC_AUTHORIZATION = "Basic cGxhdGZvcm06cGxhdGZvcm0=";

export interface SignInReq {
	mobile?: string | number;
	tenantId?: number;
	username: string;
	password?: string;
	code?: string | number;
	grant_type: "feishu_code" | "password";
	feishuCode?: string | number;
	randomStr: string;
}

export interface PreLoginReq {
	grantType?: "password";
	password: string;
	username: string;
	[property: string]: unknown;
}

export interface LoginTenantOptionVO {
	businessCodes?: string[];
	status?: number;
	tenantCode?: string;
	tenantId?: number;
	tenantName?: string;
	[property: string]: unknown;
}

export interface PreLoginUserInfo {
	nickname?: string;
	phone?: string;
	tenantOptions?: LoginTenantOptionVO[];
	userId?: number;
	username?: string;
	[property: string]: unknown;
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
	[property: string]: unknown;
}

export interface SignUpReq extends SignInReq {
	email: string;
}
export type SignInRes = {
	access_token: string;
	refresh_token: string;
	user_info: UserInfoFromApi;
};

export enum UserApi {
	PreLogin = "/auth/oauth2/pre-login",
	SignIn = "/auth/oauth2/token",
	SignUp = "/auth/signup",
	Logout = "/auth/logout",
	Refresh = "/auth/refresh",
	User = "/user",
	AvailableAgents = "admin/user/availableAgents",
}

const preLogin = (data: PreLoginReq) =>
	apiClient.post<PreLoginUserInfo>(
		UserApi.PreLogin,
		{},
		{
			params: data,
			headers: {
				authorization: OAUTH_BASIC_AUTHORIZATION,
			},
		},
	);

const signin = (data: SignInReq) =>
	apiClient.post<SignInRes>(
		UserApi.SignIn,
		{},
		{
			params: data,
			headers: {
				authorization: OAUTH_BASIC_AUTHORIZATION,
				"TENANT-ID": data.tenantId ? String(data.tenantId) : undefined,
			},
		},
	);
const signup = (data: SignUpReq) => apiClient.post<SignInRes>(UserApi.SignUp, data);
const logout = () => apiClient.get(UserApi.Logout);
const findById = (id: string) => apiClient.get<UserInfo[]>(`${UserApi.User}/${id}`);
const getAvailableAgents = () => apiClient.get<TenantAiAgentVO[]>(UserApi.AvailableAgents);

export default {
	preLogin,
	signin,
	signup,
	findById,
	getAvailableAgents,
	logout,
};
