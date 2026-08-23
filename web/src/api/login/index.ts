import apiClient, { ApiClient } from "../apiClient";

const wxApiClient = new ApiClient({
	baseURL: "/api/system",
});

const Path = "/auth";

export const getLoginCodeImageApi = (params: { randomStr: string }) => apiClient.get(`${Path}/code/image`, { params });

export const getFeishuCodeApi = (params: { mobile: string | number }) =>
	apiClient.get(`${Path}/code/feishuCode`, { params });

export const postTokenApi = (data: { mobile: string; code: string; randomStr?: string }) =>
	apiClient.post(`${Path}/oauth2/token`, data);

export const postWxTokenApi = (data: { mobile: string; code: string }) =>
	wxApiClient.post<{ token: string }>("/v1/account/login", data);

export const getWxVerificationCode = (mobile: string) =>
	wxApiClient.post<void>(`/v1/account/login/${mobile}/verification-code`);
// /**
//  * 获取验证码
//  * @param {string} mobile
//  * @returns {Promise<void>}
//  */
// export const getVerificationCode = (mobile: string) =>
//     apiClient.post<void>(`/system/v1/account/login/${mobile}/verification-code`);
// /**
//  * 登录
//  * @param {LoginParams} data
//  * @returns {Promise<LoginRes>}
//  */
// export const login = (data: LoginParams) => {
//     return apiClient.post<LoginRes>('/system/v1/account/login', data);
// };
// export interface LoginParams {
//     mobile: string;
//     code: string;
// }
// interface LoginRes {
//     /*昵称 */
//     nickName: string;
//     /*请求身份令牌 */
//     token: string;
//     /*头像地址 */
//     headUrl: string;
//     /*角色：0-普通 1-管理 */
//     role: number;
//     /* */
//     mobile: string;
//     /* */
//     job_title: string;
// }
