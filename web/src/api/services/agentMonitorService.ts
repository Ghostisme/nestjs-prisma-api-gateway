import bffClient from "@/api/bffClient";

const agentMonitorService = {
	getDashboard: (params?: { startDate?: string; endDate?: string }) =>
		bffClient.get("/lumax/v1/agent-monitor/dashboard", { params }),
	getRuns: (params?: {
		status?: string;
		agentName?: string;
		startDate?: string;
		endDate?: string;
		page?: number;
		pageSize?: number;
	}) => bffClient.get("/lumax/v1/agent-monitor/runs", { params }),
	getRunDetail: (id: number) => bffClient.get(`/lumax/v1/agent-monitor/runs/${id}`),
	getSkillsRanking: (params?: { startDate?: string; endDate?: string }) =>
		bffClient.get("/lumax/v1/agent-monitor/skills-ranking", { params }),
	getToolsStats: () => bffClient.get("/lumax/v1/agent-monitor/tools-stats"),
};

export default agentMonitorService;
