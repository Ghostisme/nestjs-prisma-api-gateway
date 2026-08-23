// ======================== Token 用户管理 ========================

/** Token 用户记录 */
export interface TokenUserRecord {
	id: number;
	name: string;
	department: string;
	tokenQuota: number;
	usedQuota: number;
	quotaLimit: "是" | "否";
	userSatisfaction: string;
	lastUsedTime: string;
}

/** Model Token 统计卡片 */
export interface ModelTokenStat {
	modelName: string;
	totalTokens: number;
}

/** 配额操作类型 */
export type QuotaOperationType = "noChange" | "increase" | "decrease" | "unlimited";

/** 配额操作记录 */
export interface QuotaOperationRecord {
	originalQuota: number;
	operation: string;
	actualQuota: number | string;
	operatorName: string;
	operateTime: string;
}

/** Token 消耗明细 */
export interface TokenConsumptionDetail {
	id: number;
	modelType: string;
	agentName: string;
	inputToken: number;
	outToken: number;
	consumeToken: number;
	remainToken: number;
	consumeTime: string;
}

// ======================== Token 系统管理 ========================

/** 组织架构节点类型 */
export type OrgNodeType = "company" | "department";

/** 组织架构节点（部门 / 公司） */
export interface OrgNode {
	nodeId: string;
	nodeName: string;
	nodeType: OrgNodeType;
	memberCount: number;
	children?: OrgNode[];
}

/** 部门/公司下的成员记录 */
export interface OrgMember {
	memberId: string;
	memberName: string;
	avatar?: string;
	department: string;
	tokenQuota: number;
	/** -1 表示不限制 */
	remainToken?: number;
}

/** 选中节点的详情 */
export interface OrgNodeDetail {
	nodeId: string;
	nodeName: string;
	nodeType: OrgNodeType;
	/** 本节点直属成员（例如部门领导） */
	directMembers: OrgMember[];
	/** 子部门 */
	subDepartments: OrgNode[];
}

/** Token 配置参数 */
export interface TokenConfigPayload {
	/** 是否不限制 */
	unlimited: boolean;
	/** 额度数值 */
	quota?: number;
	/** 周期（当月/当日/按天） */
	period?: "month" | "day" | "custom";
}

// ======================== 用户对话统计 ========================

/** 用户对话统计记录 */
export interface UserConversationRecord {
	id: number;
	name: string;
	department: string;
	conversationCount: number;
	userSatisfaction: string;
	lastConversationTime: string;
}

/** 对话明细记录 */
export interface ConversationDetailRecord {
	dialogId: string;
	model: string;
	agent: string;
	dialogTitle: string;
	startTime: string;
	endTime: string;
	duration: string;
	consumeToken: number;
	userSatisfaction: string;
	bannedWordTriggerCount: number;
}

/** 对话详情 - 基本信息 */
export interface ConversationViewInfo {
	dialogTitle: string;
	model: string;
	agent: string;
	totalMessages: number;
	userMessages: number;
	agentMessages: number;
	userSatisfaction: string;
	startTime: string;
	endTime: string;
	duration: string;
	avgResponseTime: string;
	consumeToken: number;
}

/** 对话详情 - 违禁词触发 */
export interface ConversationBannedWordHit {
	triggerTime: string;
	triggeredWord: string;
	triggerSentence: string;
}

/** 对话消息角色 */
export type MessageRole = "user" | "assistant";

/** 对话消息 */
export interface ConversationMessage {
	id: number;
	role: MessageRole;
	content: string;
	timestamp: string;
	isBannedContent?: boolean;
}

/** 对话详情完整数据 */
export interface ConversationViewData {
	info: ConversationViewInfo;
	bannedWordHits: ConversationBannedWordHit[];
	messages: ConversationMessage[];
}

// ======================== AI 违禁词管理 ========================

/** 违禁词类型 */
export type BannedWordCategory =
	| "政治敏感"
	| "暴力恐怖"
	| "色情低俗"
	| "商品违法"
	| "虚假宣传"
	| "歧视骚扰"
	| "广告营销"
	| "不良诱导"
	| "隐私侵犯"
	| "仇恨仇视"
	| "其他类型";

/** 风险等级 */
export type RiskLevel = "高风险" | "中风险" | "低风险";

/** 违禁词类型统计 */
export interface BannedWordCategoryRecord {
	id: number;
	category: BannedWordCategory;
	riskLevel: RiskLevel;
	wordCount: number;
	triggerCount: number;
}

/** 违禁词总览 */
export interface BannedWordOverview {
	totalWords: number;
	totalUserTriggerCount: number;
	totalInterceptCount: number;
}

/** 违禁词明细 */
export interface BannedWordItem {
	id: number;
	wordName: string;
	inputTrigger: boolean;
	outputTrigger: boolean;
	exactMatch: boolean;
	fuzzyMatch: boolean;
	semanticMatch: boolean;
	modelMatch: boolean;
	addTime: string;
	status: "启用" | "禁用";
}

/** 添加违禁词表单 */
export interface AddBannedWordForm {
	category: BannedWordCategory;
	riskLevel: RiskLevel;
	word: string;
	triggerMode: ("input" | "output")[];
	matchMode: ("exact" | "fuzzy" | "semantic" | "model")[];
}

/** 违禁词触发记录 */
export interface BannedWordTriggerRecord {
	id: number;
	userName: string;
	wordName: string;
	triggerTime: string;
	interceptStatus: string;
}

/** 用户违禁词触发排行 */
export interface UserBannedWordRank {
	userName: string;
	count: number;
}
