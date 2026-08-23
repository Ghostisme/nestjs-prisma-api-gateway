export interface CommonList<T> {
	records: T[];
	total: number;
	size: number;
	current: number;
	orders?: OrderInfo[];
	optimizeCountSql?: boolean;
	searchCount?: boolean;
	optimizeJoinOfCountSql?: boolean;
	maxLimit?: number;
	countId?: string;
}

export interface OrderInfo {
	column: string;
	asc: boolean;
}
