import { useState, useCallback } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export interface PageResult<T> {
	records: T[];
	total: number;
	size: number;
	current: number;
	pages: number;
}

export interface PaginationParams {
	current: number;
	size: number;
}

export interface UsePaginatedQueryOptions<T, F = Record<string, unknown>> {
	queryKey: string;
	fetchFn: (params: PaginationParams & F) => Promise<PageResult<T>>;
	defaultSize?: number;
	defaultFilters?: F;
	enabled?: boolean;
}

export interface UsePaginatedQueryReturn<T, F = Record<string, unknown>> {
	data: T[];
	total: number;
	pagination: PaginationParams;
	loading: boolean;
	filters: F;
	setFilters: (f: F) => void;
	setPagination: (p: Partial<PaginationParams>) => void;
	refresh: () => void;
	query: UseQueryResult<PageResult<T>>;
}

/**
 * 通用分页查询 Hook
 * 封装分页参数 + 筛选条件 + react-query 缓存
 */
export function usePaginatedQuery<T, F = Record<string, unknown>>(
	options: UsePaginatedQueryOptions<T, F>,
): UsePaginatedQueryReturn<T, F> {
	const { queryKey, fetchFn, defaultSize = 10, defaultFilters, enabled = true } = options;

	const [pagination, setPaginationState] = useState<PaginationParams>({
		current: 1,
		size: defaultSize,
	});

	const [filters, setFiltersState] = useState<F>((defaultFilters ?? {}) as F);

	const query = useQuery({
		queryKey: [queryKey, pagination.current, pagination.size, filters],
		queryFn: () => fetchFn({ ...pagination, ...filters }),
		enabled,
	});

	const setPagination = useCallback((p: Partial<PaginationParams>) => {
		setPaginationState((prev) => ({ ...prev, ...p }));
	}, []);

	const setFilters = useCallback((f: F) => {
		setFiltersState(f);
		setPaginationState((prev) => ({ ...prev, current: 1 }));
	}, []);

	const refresh = useCallback(() => {
		query.refetch();
	}, [query]);

	return {
		data: query.data?.records ?? [],
		total: query.data?.total ?? 0,
		pagination,
		loading: query.isLoading || query.isFetching,
		filters,
		setFilters,
		setPagination,
		refresh,
		query,
	};
}
