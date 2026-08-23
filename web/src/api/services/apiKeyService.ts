import bffClient from "@/api/bffClient";

export interface CreateApiKeyParams {
	name: string;
	scopes?: string[];
	rateLimit?: number;
	expiresAt?: string;
}

const apiKeyService = {
	list: (params?: { status?: string; page?: number; pageSize?: number }) =>
		bffClient.get("/lumax/v1/api-keys", { params }),
	create: (data: CreateApiKeyParams) => bffClient.post("/lumax/v1/api-keys", data),
	revoke: (id: number) => bffClient.put(`/lumax/v1/api-keys/${id}/revoke`),
	remove: (id: number) => bffClient.delete(`/lumax/v1/api-keys/${id}`),
	getUsage: (id: number) => bffClient.get(`/lumax/v1/api-keys/${id}/usage`),
};

export default apiKeyService;
