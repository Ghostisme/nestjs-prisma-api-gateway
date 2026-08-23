/** 当前订阅信息 */
export interface SubscriptionInfo {
	planTier: string;
	planName: string;
	status: string;
	tokenLimitMonthly: number;
	concurrentLimit: number;
	features: string[];
	periodStart: string | null;
	periodEnd: string | null;
}

/** 套餐配置项 */
export interface PlanConfig {
	id: number;
	tier: string;
	name: string;
	description: string;
	priceMonthly: number;
	tokenLimitMonthly: number;
	concurrentLimit: number;
	features: string[];
	status: string;
	sortOrder: number;
}
