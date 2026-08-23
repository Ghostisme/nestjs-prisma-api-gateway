/** API Key 列表项 */
export interface ApiKeyItem {
	id: number;
	name: string;
	keyPrefix: string;
	scopes: string[];
	rateLimit: number;
	expiresAt: string | null;
	lastUsedAt: string | null;
	status: string;
	createdAt: string;
}

/** 创建 API Key 请求参数 */
export interface CreateApiKeyRequest {
	name: string;
	scopes?: string[];
	rateLimit?: number;
	expiresAt?: string;
}

/** 创建 API Key 响应（含完整密钥，仅展示一次） */
export interface ApiKeyCreatedResponse {
	id: number;
	name: string;
	key: string;
	keyPrefix: string;
	scopes: string[];
	rateLimit: number;
	expiresAt: string | null;
	createdAt: string;
}
