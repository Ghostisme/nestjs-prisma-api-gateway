import bffClient from "@/api/bffClient";

export interface LlmModelItem {
	id: number;
	modelName: string;
	provider: string;
	modelType: string;
	status: string;
	inputPrice: number;
	outputPrice: number;
	maxTokens: number;
	description?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface LlmModelListParams {
	page?: number;
	pageSize?: number;
	provider?: string;
	status?: string;
	keyword?: string;
}

const llmModelService = {
	list: (params?: LlmModelListParams) =>
		bffClient.post<{ items: LlmModelItem[]; total: number }>("/lumax/v1/llm-models/list", params ?? {}),
	getProviders: () => bffClient.get<string[]>("/lumax/v1/llm-models/providers"),
	getById: (id: number) => bffClient.get<LlmModelItem>(`/lumax/v1/llm-models/${id}`),
	create: (data: Partial<LlmModelItem>) => bffClient.post("/lumax/v1/llm-models", data),
	update: (id: number, data: Partial<LlmModelItem>) => bffClient.put(`/lumax/v1/llm-models/${id}`, data),
	updateStatus: (id: number, status: string) => bffClient.put(`/lumax/v1/llm-models/${id}/status`, { status }),
	remove: (id: number) => bffClient.delete(`/lumax/v1/llm-models/${id}`),
};

export default llmModelService;
