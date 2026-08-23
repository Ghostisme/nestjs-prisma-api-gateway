/** 用量概览 */
export interface UsageSummary {
	tokensIn: number;
	tokensOut: number;
	tokensTotal: number;
	callsCount: number;
	avgResponseTimeMs: number;
}

/** Token 消耗趋势 */
export interface UsageTrend {
	date: string;
	tokensIn: number;
	tokensOut: number;
	callsCount: number;
}

/** 模型用量分布 */
export interface ModelDistribution {
	modelName: string;
	tokensTotal: number;
	callsCount: number;
}

/** 用户用量排名 */
export interface TopUser {
	userId: number;
	username: string;
	tokensTotal: number;
	callsCount: number;
}

/** 配额状态 */
export interface QuotaStatus {
	planTier: string;
	tokenLimit: number;
	tokenUsed: number;
	tokenRemaining: number;
	usagePercent: number;
	callsThisMonth: number;
	concurrentLimit: number;
}

/** 配额规则 */
export interface QuotaRule {
	id: number;
	planTier: string;
	tokenLimit: number;
	callsLimit: number;
	concurrentLimit: number;
	rateLimit: number;
	enabled: boolean;
	updatedAt: string;
}

/** Agent 运行看板 */
export interface AgentRunDashboard {
	total: number;
	completed: number;
	failed: number;
	running: number;
	successRate: number;
	avgDurationMs: number;
	avgTokens: number;
	errorDistribution: { errorType: string; count: number }[];
}

/** Agent 运行记录 */
export interface AgentRunRecord {
	id: number;
	threadId: string;
	agentName: string;
	skillName: string;
	status: string;
	durationMs: number;
	tokensTotal: number;
	errorType?: string;
	startedAt: string;
	endedAt?: string;
}

/** 技能排行 */
export interface SkillRanking {
	skillName: string;
	callsCount: number;
	avgDurationMs: number;
	avgTokens: number;
	successRate: number;
}
