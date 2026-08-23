/** 时间筛选类型 */
export type TimeFilterType = "all" | "yesterday" | "last7days" | "last30days" | "custom";
export type DashboardAgentFilterValue = string | number;

/** 通用筛选条件 */
export interface DashboardFilter {
	model: string;
	agent: DashboardAgentFilterValue;
	timeRange: TimeFilterType;
	customRange?: [string, string];
}

/** 统计卡片数据 */
export interface StatCardData {
	title: string;
	value: string | number;
	dayOverDay?: number;
	prefix?: string;
	suffix?: string;
}

/** 饼图数据项 */
export interface PieChartItem {
	name: string;
	value: number;
}

/** 响应时间分布项 */
export interface ResponseTimeItem {
	range: string;
	count: number;
}

/** 用户活跃度趋势数据 */
export interface ActivityTrendItem {
	date: string;
	value: number;
}

/** 用户数据看板 - 总览 */
export interface UserDashboardOverview {
	totalConversations: number;
	totalUsers: number;
	activeUsers: number;
	satisfactionRate: number;
	dayOverDay: {
		conversations: number;
		users: number;
		activeUsers: number;
		satisfaction: number;
	};
}

/** 用户数据看板完整数据 */
export interface UserDashboardData {
	overview: UserDashboardOverview;
	modelUsage: PieChartItem[];
	responseTime: ResponseTimeItem[];
	activityTrend: ActivityTrendItem[];
}

/** Token消耗趋势项 */
export interface TokenTrendItem {
	date: string;
	input: number;
	output: number;
}

/** 用户Token消耗项 */
export interface UserTokenItem {
	username: string;
	tokens: number;
}

/** Agent消耗项 */
export interface AgentConsumptionItem {
	agentName: string;
	model: string;
	tokens: number;
	avgResponseTime: string;
}

/** Token用量统计 - 总览 */
export interface TokenDashboardOverview {
	totalTokens: number;
	inputTokens: number;
	outputTokens: number;
	totalCost: number;
	dayOverDay: {
		totalTokens: number;
		inputTokens: number;
		outputTokens: number;
		totalCost: number;
	};
}

/** Token用量统计完整数据 */
export interface TokenDashboardData {
	overview: TokenDashboardOverview;
	userTokenUsage: UserTokenItem[];
	tokenTrend: TokenTrendItem[];
	agentConsumption: AgentConsumptionItem[];
}

/** 反馈统计项 */
export interface FeedbackStatItem {
	date: string;
	positive: number;
	negative: number;
}

/** 反馈记录 */
export interface FeedbackRecord {
	id: number;
	result: "positive" | "negative";
	userQuestion: string;
	agentName: string;
	feedbackTime: string;
}

/** 用户反馈看板 - 总览 */
export interface FeedbackDashboardOverview {
	totalFeedbacks: number;
	positiveRate: number;
	negativeRate: number;
	dayOverDay: {
		totalFeedbacks: number;
		positiveRate: number;
		negativeRate: number;
	};
}

/** 用户反馈看板完整数据 */
export interface FeedbackDashboardData {
	overview: FeedbackDashboardOverview;
	feedbackStats: FeedbackStatItem[];
	feedbackDistribution: PieChartItem[];
	feedbackRecords: FeedbackRecord[];
}
