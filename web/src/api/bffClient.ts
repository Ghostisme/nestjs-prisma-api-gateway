import { ApiClient } from "./apiClient";

/**
 * Lumax BFF (Node.js) API 客户端
 *
 * 开发环境: /api/lumax/v1/* 由 Vite proxy 代理到本地 BFF
 * 线上环境: 通过 VITE_APP_BFF_BASE_URL 直连 BFF 服务（与 Java Gateway 同理）
 */
const bffClient = new ApiClient({
	baseURL: import.meta.env.VITE_APP_BFF_BASE_URL || "/api",
});

export default bffClient;
