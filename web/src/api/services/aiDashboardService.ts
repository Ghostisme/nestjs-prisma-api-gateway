import bffClient from "@/api/bffClient";
import type {
	DashboardFilter,
	FeedbackDashboardData,
	TokenDashboardData,
	UserDashboardData,
} from "@/pages/aiDashboard/types";

const getUserDashboard = async (filter?: DashboardFilter): Promise<UserDashboardData> => {
	return bffClient.post<UserDashboardData>("/lumax/v1/dashboard/user", filter ?? {});
};

const getTokenDashboard = async (filter?: DashboardFilter): Promise<TokenDashboardData> => {
	return bffClient.post<TokenDashboardData>("/lumax/v1/dashboard/token", filter ?? {});
};

const getFeedbackDashboard = async (filter?: DashboardFilter): Promise<FeedbackDashboardData> => {
	return bffClient.post<FeedbackDashboardData>("/lumax/v1/dashboard/feedback", filter ?? {});
};

export default {
	getUserDashboard,
	getTokenDashboard,
	getFeedbackDashboard,
};
