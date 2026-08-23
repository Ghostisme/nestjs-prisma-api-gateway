import bffClient from "@/api/bffClient";
import type { KnowledgeBaseDetail, KnowledgeBaseListData, KnowledgeBaseFormData } from "@/pages/aiKnowledgeBase/types";

const getKnowledgeBaseList = async (params?: Record<string, unknown>): Promise<KnowledgeBaseListData> => {
	return bffClient.post<KnowledgeBaseListData>("/lumax/v1/knowledge-bases/list", params ?? {});
};

const getKnowledgeBaseDetail = async (id: string): Promise<KnowledgeBaseDetail> => {
	return bffClient.get<KnowledgeBaseDetail>(`/lumax/v1/knowledge-bases/${id}`);
};

const createKnowledgeBase = async (data: KnowledgeBaseFormData): Promise<{ id: string }> => {
	return bffClient.post<{ id: string }>("/lumax/v1/knowledge-bases", data);
};

const updateKnowledgeBase = async (id: string, data: KnowledgeBaseFormData): Promise<void> => {
	await bffClient.put(`/lumax/v1/knowledge-bases/${id}`, data);
};

const toggleKnowledgeBaseStatus = async (id: string, status: "active" | "disabled"): Promise<void> => {
	await bffClient.put(`/lumax/v1/knowledge-bases/${id}/status`, { status });
};

export default {
	getKnowledgeBaseList,
	getKnowledgeBaseDetail,
	createKnowledgeBase,
	updateKnowledgeBase,
	toggleKnowledgeBaseStatus,
};
