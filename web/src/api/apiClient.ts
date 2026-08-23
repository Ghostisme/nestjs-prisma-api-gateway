import axios, {
	type AxiosError,
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
// import { toast } from "sonner";
import type { Result } from "#/api";
import { ResultStatus } from "#/enum";
import { GLOBAL_CONFIG } from "@/global-config";
import userStore from "@/store/userStore";
import { type ApiResponseErrorPayload, createApiBusinessError, getApiResponseMessage } from "@/utils/request-error";

// ===================== 类型定义 =====================
export interface ApiClientOptions {
	baseURL?: string;
	timeout?: number;
	headers?: Record<string, string | undefined>;
}

export interface DownloadResponse {
	data: Blob;
	filename?: string;
}

const PRE_LOGIN_PATH_REGEXP = /\/auth\/oauth2\/pre-login$/i;

const shouldAttachTenantHeader = (url?: string): boolean => {
	if (!url) return false;
	return !PRE_LOGIN_PATH_REGEXP.test(url);
};

// ===================== 工具函数 =====================
/**
 * 简单的 Logger 接口实现（基于 console）
 */
class SimpleLogger {
	debug(message: string, data?: any) {
		if (import.meta.env.DEV) {
			console.debug(`[DEBUG] ${message}`, data || "");
		}
	}

	info(message: string, data?: any) {
		console.info(`[INFO] ${message}`, data || "");
	}

	warn(message: string, data?: any) {
		console.warn(`[WARN] ${message}`, data || "");
	}

	error(message: string, error?: any, data?: any) {
		console.error(`[ERROR] ${message}`, error, data || "");
	}
}

const getResponseMsg = (payload?: ApiResponseErrorPayload): string | undefined => {
	return getApiResponseMessage(payload) ?? (typeof payload?.msg === "string" ? payload.msg : undefined);
};

// /**
//  * 获取智能 Content-Type
//  */
// function getSmartContentType(file: File): string {
// 	if (file.type) {
// 		return file.type;
// 	}

// 	const ext = file.name.split(".").pop()?.toLowerCase();
// 	const mimeTypes: Record<string, string> = {
// 		jpg: "image/jpeg",
// 		jpeg: "image/jpeg",
// 		png: "image/png",
// 		gif: "image/gif",
// 		webp: "image/webp",
// 		pdf: "application/pdf",
// 		doc: "application/msword",
// 		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// 		xls: "application/vnd.ms-excel",
// 		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// 	};

// 	return mimeTypes[ext || ""] || "application/octet-stream";
// }

// ===================== API Client =====================
export class ApiClient {
	private instance: AxiosInstance;
	private logger: SimpleLogger;
	private requestTimings: Map<string, number> = new Map();

	constructor(options: ApiClientOptions = {}) {
		const { baseURL = GLOBAL_CONFIG.apiBaseUrl, timeout = 50000, headers } = options;

		this.logger = new SimpleLogger();
		this.instance = axios.create({
			baseURL,
			timeout,
			headers: {
				"Content-Type": "application/json;charset=utf-8",
				...headers,
			},
		});

		this.setupInterceptors();
		this.logger.info("ApiClient initialized", { baseURL, timeout });
	}

	private setupInterceptors() {
		// ========== 请求拦截器 ==========
		this.instance.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				// 1. 生成请求唯一标识并记录时间
				const requestId = `${config.method?.toUpperCase()}_${config.url}_${Date.now()}`;
				(config as any).requestId = requestId;
				this.requestTimings.set(requestId, Date.now());

				// 2. 动态获取最新的 Token
				// const { accessToken, wxAccessToken } = userStore.getState().userToken;

				// console.log("请求时的万象token", wxAccessToken, config);
				// const isWxApi = config.baseURL?.endsWith("/material") || config.baseURL?.endsWith("/system");
				// const token = isWxApi ? (wxAccessToken || accessToken) : accessToken;
				// const token = isWxApi ? wxAccessToken : accessToken;

				const token = userStore.getState().userToken.accessToken;
				if (token && !config.headers.Authorization) {
					config.headers.Authorization = `Bearer ${token}`;
				}

				const tenantId = userStore.getState().tenantId;
				if (tenantId && shouldAttachTenantHeader(config.url)) {
					config.headers["TENANT-ID"] = String(tenantId);
				}

				// 3. 自动适配 FormData：如果是上传表单，删除 Content-Type 让浏览器自动设置 Boundary
				if (config.data instanceof FormData) {
					(config.headers as any)["Content-Type"] = undefined;
				}

				// 4. 添加业务代码
				config.headers["Business-Code"] = import.meta.env.VITE_API_BASE_BUSINESS_CODE;

				// 5. 记录请求日志
				this.logger.debug("HTTP request started", {
					requestId,
					method: config.method?.toUpperCase(),
					url: config.url,
					baseURL: config.baseURL,
					hasAuth: !!token,
				});

				return config;
			},
			(error) => {
				this.logger.error("Request interceptor error", error);
				return Promise.reject(error);
			},
		);

		// ========== 响应拦截器 ==========
		this.instance.interceptors.response.use(
			(res: AxiosResponse<Result<any>>) => {
				const config = res.config as any;
				const requestId = config.requestId;
				const duration = this.calculateDuration(requestId);

				// 处理 Blob/ArrayBuffer 类型响应
				const responseType = res.config?.responseType;
				if (responseType === "blob" || responseType === "arraybuffer") {
					this.logger.info("HTTP request succeeded (blob/arraybuffer)", {
						requestId,
						status: res.status,
						duration,
					});
					return res as unknown as any;
				}

				if (!res.data) {
					throw createApiBusinessError({
						message: "服务器未返回有效数据",
						status: res.status,
					});
				}

				const responseData = res.data as ApiResponseErrorPayload;
				const { code, data } = res.data;
				const responseMessage = getApiResponseMessage(responseData);
				const responseMsg = getResponseMsg(responseData);

				// 401/424 未授权处理
				if (code === 401 || code === 424) {
					this.logger.warn("Unauthorized access", {
						requestId,
						url: config?.url,
					});
					userStore.getState().actions.clearUserInfoAndToken();
					const loginPath = "/auth/login";
					if (window.location.pathname !== loginPath) {
						window.location.href = loginPath;
					}
				}

				// 业务逻辑成功处理
				if (code === ResultStatus.SUCCESS) {
					this.logger.info("API response successful", {
						requestId,
						code,
						duration,
					});
					return data;
				}

				// 业务逻辑错误处理
				this.logger.warn("API business error", {
					requestId,
					code,
					message: responseMsg,
					duration,
				});
				throw createApiBusinessError({
					code,
					msg: responseMsg,
					message: responseMessage,
					responseData,
					status: res.status,
				});
			},
			(error: AxiosError<Result>) => {
				const config = error.config as any;
				const requestId = config?.requestId;
				const duration = this.calculateDuration(requestId);

				const { response, message } = error || {};
				const responseData = response?.data as ApiResponseErrorPayload | undefined;
				const responseMessage = getApiResponseMessage(responseData);
				const apiError = createApiBusinessError({
					code: responseData?.code,
					msg: getResponseMsg(responseData),
					message: responseMessage ?? message,
					responseData,
					status: response?.status,
				});

				// 方案 A：页面自行决定是否提示，这里只抛错不做全局 toast，避免和页面 catch 中的 message.error 重复。
				// 如需恢复 HTTP 错误的全局提示，可取消下面这行注释。
				// toast.error(apiError.message, { position: "top-center" });

				// 记录错误日志
				this.logger.error("HTTP request failed", error, {
					requestId,
					method: config?.method?.toUpperCase(),
					url: config?.url,
					status: response?.status,
					duration,
				});

				// 401/424 未授权处理
				if (response?.status === 401 || response?.status === 424) {
					this.logger.warn("Unauthorized access", {
						requestId,
						url: config?.url,
					});
					userStore.getState().actions.clearUserInfoAndToken();
					const loginPath = "/auth/login";
					if (window.location.pathname !== loginPath) {
						window.location.href = loginPath;
					}
				}

				return Promise.reject(apiError);
			},
		);
	}

	private calculateDuration(requestId: string): number | undefined {
		if (!requestId) return undefined;

		const startTime = this.requestTimings.get(requestId);
		if (!startTime) return undefined;

		const duration = Date.now() - startTime;
		this.requestTimings.delete(requestId); // 清理
		return duration;
	}

	// ==================== 基础请求方法 ====================

	/**
	 * 通用请求方法，确保泛型穿透
	 */
	request<T = any>(config: AxiosRequestConfig): Promise<T> {
		this.logger.debug("Executing request", {
			url: config.url,
			method: config.method,
		});
		return this.instance.request<any, T>(config);
	}

	/**
	 * GET 请求
	 */
	get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, url, method: "GET" });
	}

	/**
	 * POST 请求
	 */
	post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, url, data, method: "POST" });
	}

	/**
	 * PUT 请求
	 */
	put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, url, data, method: "PUT" });
	}

	/**
	 * DELETE 请求
	 */
	delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, url, method: "DELETE" });
	}

	/**
	 * PATCH 请求
	 */
	patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, url, data, method: "PATCH" });
	}

	// ==================== 高级功能方法 ====================

	/**
	 * 上传文件请求
	 * 自动处理 FormData 的 Content-Type，确保 boundary 正确
	 */
	async upload<T = any>(url: string, data: FormData | any, config?: AxiosRequestConfig): Promise<T> {
		this.logger.debug("Executing Upload request", { url });
		return this.post<T>(url, data, {
			...config,
			headers: {
				...config?.headers,
				"Content-Type": data instanceof FormData ? undefined : "multipart/form-data",
			},
		});
	}

	/**
	 * 导出/下载文件
	 * 1. 自动设置 responseType: 'blob'
	 * 2. 自动解析 Content-Disposition 中的文件名
	 *
	 * @param url 下载地址
	 * @param data 请求参数（有值则为 POST，无值则为 GET）
	 * @param config 其他配置
	 * @returns {Promise<DownloadResponse>} 包含 Blob 数据和文件名的对象
	 */
	async download(url: string, data?: any, config?: AxiosRequestConfig): Promise<DownloadResponse> {
		this.logger.debug("Executing Download request", { url });

		const response = await this.instance.request({
			url,
			method: data ? "POST" : "GET",
			data: data,
			params: !data ? config?.params : undefined,
			...config,
			responseType: "blob", // 强制指定为 blob
		});

		// 解析文件名
		let filename: string | undefined;
		const contentDisposition = response.headers["content-disposition"];

		if (contentDisposition) {
			// 1. 优先尝试解析 RFC 5987 格式 (filename*=UTF-8''encoded_name)
			const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
			if (filenameStarMatch?.[1]) {
				filename = decodeURIComponent(filenameStarMatch[1]);
			} else {
				// 2. 降级解析常规格式 (filename="name" 或 filename=name)
				const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
				if (filenameMatch?.[1]) {
					filename = filenameMatch[1];
				}
			}
		}

		return {
			data: response.data,
			filename,
		};
	}

	// ==================== Token 管理 ====================

	/**
	 * 设置 Token（如需使用 localStorage）
	 */
	setToken(token: string) {
		if (typeof window !== "undefined") {
			localStorage.setItem("app_token", token);
			this.logger.info("Token set", { tokenLength: token.length });
		}
	}

	/**
	 * 清除 Token
	 */
	clearToken() {
		if (typeof window !== "undefined") {
			localStorage.removeItem("app_token");
			this.logger.info("Token cleared");
		}
	}

	/**
	 * 获取原始 axios 实例（高级用法）
	 */
	getAxiosInstance(): AxiosInstance {
		return this.instance;
	}
}

// ==================== 导出默认实例 ====================

export const axiosInstance = new ApiClient().getAxiosInstance();
export default new ApiClient();
