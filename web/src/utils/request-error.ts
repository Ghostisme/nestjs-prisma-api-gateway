import type { Result } from "#/api";

// 统一描述后端常见错误响应结构，兼容 { code, msg, data } 和额外的 message 字段。
export type ApiResponseErrorPayload = Partial<Result<unknown>> & {
	message?: string;
};

type ApiBusinessErrorOptions = {
	code?: number;
	msg?: string;
	responseData?: ApiResponseErrorPayload;
	status?: number;
};

// 提取非空字符串，避免把空串继续向上层透传成“有效提示”。
const getTrimmedString = (value: unknown): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmedValue = value.trim();
	return trimmedValue || undefined;
};

// 后端同时返回 message / msg 时，优先取 message；两者都没有再由上层决定兜底文案。
export const getApiResponseMessage = (payload?: ApiResponseErrorPayload): string | undefined => {
	return getTrimmedString(payload?.message) ?? getTrimmedString(payload?.msg);
};

// 统一业务错误对象，便于页面侧既能直接拿 message 展示，也能按需读取 code / msg / status。
export class ApiBusinessError extends Error {
	code?: number;
	msg?: string;
	responseData?: ApiResponseErrorPayload;
	status?: number;

	constructor(message: string, options: ApiBusinessErrorOptions = {}) {
		super(message);
		this.name = "ApiBusinessError";
		this.code = options.code;
		this.msg = options.msg;
		this.responseData = options.responseData;
		this.status = options.status;
	}
}

// 将接口层拿到的零散错误信息收敛成统一错误对象，确保后端 msg 能稳定透传到页面。
export const createApiBusinessError = ({
	code,
	msg,
	message,
	responseData,
	status,
}: ApiBusinessErrorOptions & {
	message?: string;
}): ApiBusinessError => {
	const resolvedMsg = getTrimmedString(msg) ?? getApiResponseMessage(responseData);
	const resolvedMessage = getTrimmedString(message) ?? resolvedMsg ?? "请求出错，请稍候重试";

	return new ApiBusinessError(resolvedMessage, {
		code,
		msg: resolvedMsg,
		responseData,
		status,
	});
};

// 页面展示错误提示时统一调用这里，按“后端响应文案 -> Error.message -> fallback”的顺序取值。
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
	if (error instanceof ApiBusinessError) {
		return getTrimmedString(error.message) ?? getTrimmedString(error.msg) ?? fallback;
	}

	if (typeof error === "object" && error !== null) {
		const maybeError = error as {
			message?: unknown;
			msg?: unknown;
			response?: {
				data?: ApiResponseErrorPayload;
			};
		};
		const responseMessage = getApiResponseMessage(maybeError.response?.data);
		const directMessage = getTrimmedString(maybeError.message);
		const directMsg = getTrimmedString(maybeError.msg);

		return responseMessage ?? directMessage ?? directMsg ?? fallback;
	}

	if (error instanceof Error) {
		return getTrimmedString(error.message) ?? fallback;
	}

	return fallback;
};
