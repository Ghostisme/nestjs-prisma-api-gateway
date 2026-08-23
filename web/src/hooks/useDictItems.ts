import { useQuery } from "@tanstack/react-query";
import bffClient from "@/api/bffClient";

export interface DictItem {
	id?: number;
	typeCode?: string;
	itemValue?: string;
	itemLabel?: string;
	sortOrder?: number;
	status?: number;
	value?: string;
	label?: string;
	extra?: unknown;
}

interface DictResponse {
	[typeCode: string]: DictItem[];
}

async function fetchDictItems(typeCode: string): Promise<DictItem[]> {
	return bffClient.get<DictItem[]>(`/lumax/v1/dict/${typeCode}`);
}

async function fetchDictBatch(typeCodes: string[]): Promise<DictResponse> {
	return bffClient.get<DictResponse>("/lumax/v1/dict/batch", {
		params: { typeCodes: typeCodes.join(",") },
	});
}

/**
 * 获取单个字典类型的选项列表
 * @param typeCode 字典类型编码, 如 "conversation_status"
 */
export function useDictItems(typeCode: string) {
	return useQuery({
		queryKey: ["dict", typeCode],
		queryFn: () => fetchDictItems(typeCode),
		staleTime: 5 * 60 * 1000,
		enabled: !!typeCode,
	});
}

/**
 * 批量获取多个字典类型
 * @param typeCodes 字典类型编码数组
 */
export function useDictBatch(typeCodes: string[]) {
	return useQuery({
		queryKey: ["dict-batch", ...typeCodes],
		queryFn: () => fetchDictBatch(typeCodes),
		staleTime: 5 * 60 * 1000,
		enabled: typeCodes.length > 0,
	});
}

/**
 * 将字典列表转为 Ant Design Select 组件 options
 */
export function toSelectOptions(items: DictItem[] | undefined) {
	if (!items) return [];
	return items
		.map((item) => {
			const label = item.label ?? item.itemLabel;
			const value = item.value ?? item.itemValue;
			if (!label || !value) {
				return undefined;
			}
			return {
				label,
				value,
			};
		})
		.filter((item): item is { label: string; value: string } => item !== undefined);
}
