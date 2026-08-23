import bffClient from "@/api/bffClient";

export interface UsageQueryParams {
	startDate?: string;
	endDate?: string;
	userId?: number;
	modelName?: string;
}

const usageMeteringService = {
	getSummary: (params?: UsageQueryParams) => bffClient.get("/lumax/v1/usage/summary", { params }),
	getTrends: (params?: UsageQueryParams) => bffClient.get("/lumax/v1/usage/trends", { params }),
	getByModel: (params?: UsageQueryParams) => bffClient.get("/lumax/v1/usage/by-model", { params }),
	getByUser: (params?: UsageQueryParams) => bffClient.get("/lumax/v1/usage/by-user", { params }),
	getQuotaStatus: () => bffClient.get("/lumax/v1/usage/quota-status"),
};

export default usageMeteringService;
