import bffClient from "@/api/bffClient";
import type {
	BannedWordCategoryRecord,
	BannedWordItem,
	BannedWordOverview,
	BannedWordTriggerRecord,
	ConversationDetailRecord,
	ConversationViewData,
	ModelTokenStat,
	OrgNode,
	OrgNodeDetail,
	QuotaOperationRecord,
	TokenConfigPayload,
	TokenConsumptionDetail,
	TokenUserRecord,
	UserBannedWordRank,
	UserConversationRecord,
} from "@/pages/aiManagement/types";
import type { DashboardFilter, PieChartItem } from "@/pages/aiDashboard/types";

// ======================== Token 用户管理 ========================

const getModelTokenStats = async (): Promise<ModelTokenStat[]> => {
	return bffClient.get<ModelTokenStat[]>("/lumax/v1/token/model-stats");
};

const getTokenUserList = async (
	params?: Record<string, unknown>,
): Promise<{ records: TokenUserRecord[]; total: number }> => {
	return bffClient.post("/lumax/v1/token/users", params ?? {});
};

const getQuotaRecords = async (userId: number): Promise<QuotaOperationRecord[]> => {
	return bffClient.get<QuotaOperationRecord[]>(`/lumax/v1/token/users/${userId}/quota-records`);
};

const getConsumptionDetails = async (userId: number): Promise<{ records: TokenConsumptionDetail[]; total: number }> => {
	return bffClient.post(`/lumax/v1/token/users/${userId}/consumption`, { current: 1, size: 100 });
};

const updateQuota = async (userId: number, type: string, value?: number): Promise<boolean> => {
	await bffClient.put(`/lumax/v1/token/users/${userId}/quota`, {
		operationType: type,
		amount: value ?? 0,
		reason: "管理员手动调整",
	});
	return true;
};

// ======================== 用户对话统计 ========================

const getConversationModelStats = async (): Promise<{ modelName: string; totalConversations: number }[]> => {
	return bffClient.get("/lumax/v1/conversation/model-stats");
};

const getConversationUserList = async (
	params?: Record<string, unknown>,
): Promise<{ records: UserConversationRecord[]; total: number }> => {
	return bffClient.post("/lumax/v1/conversation/users", params ?? {});
};

const getConversationDetails = async (
	userId: number,
): Promise<{ records: ConversationDetailRecord[]; total: number }> => {
	return bffClient.post(`/lumax/v1/conversation/users/${userId}/details`, { current: 1, size: 100 });
};

// ======================== AI 违禁词管理 ========================

const getBannedWordOverview = async (filter?: DashboardFilter): Promise<BannedWordOverview> => {
	return bffClient.post<BannedWordOverview>("/lumax/v1/banned-words/overview", filter ?? {});
};

const getCategoryDistribution = async (filter?: DashboardFilter): Promise<PieChartItem[]> => {
	return bffClient.post<PieChartItem[]>("/lumax/v1/banned-words/category-distribution", filter ?? {});
};

const getUserBannedWordRank = async (filter?: DashboardFilter): Promise<UserBannedWordRank[]> => {
	return bffClient.post<UserBannedWordRank[]>("/lumax/v1/banned-words/user-rank", filter ?? {});
};

const getBannedWordCategories = async (): Promise<BannedWordCategoryRecord[]> => {
	return bffClient.get<BannedWordCategoryRecord[]>("/lumax/v1/banned-words/categories");
};

const getBannedWordList = async (categoryId?: number): Promise<{ records: BannedWordItem[]; total: number }> => {
	const items = await bffClient.get<BannedWordItem[]>(`/lumax/v1/banned-words/categories/${categoryId}/words`);
	return { records: items, total: items.length };
};

const getTriggerRecords = async (
	categoryId?: number,
): Promise<{ records: BannedWordTriggerRecord[]; total: number }> => {
	const items = await bffClient.get<BannedWordTriggerRecord[]>(
		`/lumax/v1/banned-words/categories/${categoryId}/triggers`,
	);
	return { records: items, total: items.length };
};

const addBannedWord = async (data: Record<string, unknown>): Promise<boolean> => {
	await bffClient.post("/lumax/v1/banned-words", data);
	return true;
};

const toggleBannedWordStatus = async (wordId: number, currentStatus?: string): Promise<boolean> => {
	const targetStatus = currentStatus === "启用" ? "disabled" : "enabled";
	await bffClient.put(`/lumax/v1/banned-words/${wordId}/toggle`, { status: targetStatus });
	return true;
};

const deleteBannedWord = async (wordId: number): Promise<boolean> => {
	await bffClient.delete(`/lumax/v1/banned-words/${wordId}`);
	return true;
};

// ======================== 对话详情 ========================

const getConversationView = async (dialogId: string): Promise<ConversationViewData> => {
	return bffClient.get<ConversationViewData>(`/lumax/v1/conversation/view/${dialogId}`);
};

// ======================== Token 系统管理 ========================

const getOrgTree = async (): Promise<OrgNode> => {
	return bffClient.get<OrgNode>("/lumax/v1/org/tree");
};

const getOrgNodeDetail = async (nodeId: string): Promise<OrgNodeDetail> => {
	return bffClient.get<OrgNodeDetail>(`/lumax/v1/org/nodes/${nodeId}`);
};

const configureNodeToken = async (nodeId: string, payload: TokenConfigPayload): Promise<void> => {
	await bffClient.put(`/lumax/v1/org/nodes/${nodeId}/token-config`, payload);
};

const configureMemberToken = async (memberId: string, payload: TokenConfigPayload): Promise<void> => {
	await bffClient.put(`/lumax/v1/org/members/${memberId}/token-config`, payload);
};

export default {
	getModelTokenStats,
	getTokenUserList,
	getQuotaRecords,
	getConsumptionDetails,
	updateQuota,
	getConversationModelStats,
	getConversationUserList,
	getConversationDetails,
	getConversationView,
	getBannedWordOverview,
	getCategoryDistribution,
	getUserBannedWordRank,
	getBannedWordCategories,
	getBannedWordList,
	getTriggerRecords,
	addBannedWord,
	toggleBannedWordStatus,
	deleteBannedWord,
	getOrgTree,
	getOrgNodeDetail,
	configureNodeToken,
	configureMemberToken,
};
