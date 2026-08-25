import { ApiClient } from "./apiClient";

/**
 * Lumax BFF (Node.js) API 客户端
 *
 * 开发环境: /api/lumax/v1/* 由 Vite proxy 代理到本地 BFF。
 * 线上环境: 直连 BFF 服务。本项目部署形态下 BFF 与主网关是同一个 NestJS 服务，
 *           因此复用主接口的 VITE_APP_API_BASE_URL（已指向 <backend>/api），
 *           避免再单独维护一个 BFF 地址变量导致漏配时回退到相对 "/api"（会打到
 *           纯静态前端自身域名，返回 index.html 而非接口数据）。
 */
const bffClient = new ApiClient({
	baseURL: import.meta.env.VITE_APP_API_BASE_URL || "/api",
});

export default bffClient;
