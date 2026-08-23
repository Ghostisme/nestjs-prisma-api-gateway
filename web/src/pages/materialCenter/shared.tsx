import axios from "axios";
import dayjs from "dayjs";
import { type ReactNode, useCallback, useState } from "react";
import materialService from "@/api/material/materialService";
import type { CarModelTreeNode, MaterialRow } from "@/api/material/types";
import { getApiErrorMessage } from "@/utils/request-error";

export const MATERIAL_PAGE_SIZE = 20;
const DEFAULT_DOWNLOAD_FILE_NAME = "download.mp4";
const DOWNLOAD_CLEANUP_DELAY_MS = 200;
const MATERIAL_REFERENCE_STALE_TIME_MS = 5 * 60 * 1000;
const MATERIAL_REFERENCE_GC_TIME_MS = 30 * 60 * 1000;

export type MaterialViewMode = "list" | "card";
export type MaterialOrderBy = "time" | "download";

export const MATERIAL_SORT_OPTIONS: Array<{
	label: string;
	value: MaterialOrderBy;
}> = [
	{ label: "最新", value: "time" },
	{ label: "下载数", value: "download" },
];

export const MATERIAL_REFERENCE_QUERY_OPTIONS = {
	staleTime: MATERIAL_REFERENCE_STALE_TIME_MS,
	gcTime: MATERIAL_REFERENCE_GC_TIME_MS,
	refetchOnWindowFocus: false,
} as const;

export function useMaterialBatchDialog<T>() {
	const [open, setOpen] = useState(false);
	const [rows, setRows] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [onSuccess, setOnSuccess] = useState<(() => void) | null>(null);

	const resetDialog = useCallback(() => {
		setOpen(false);
		setRows([]);
		setOnSuccess(null);
	}, []);

	const closeDialog = useCallback(() => {
		if (loading) return false;
		resetDialog();
		return true;
	}, [loading, resetDialog]);

	const openDialog = useCallback((nextRows: T[], nextOnSuccess?: (() => void) | null) => {
		setRows(nextRows);
		setOnSuccess(() => nextOnSuccess ?? null);
		setOpen(true);
	}, []);

	return {
		open,
		rows,
		loading,
		onSuccess,
		setLoading,
		openDialog,
		resetDialog,
		closeDialog,
	};
}

export function formatMaterialDate(value: unknown): string {
	if (value == null || value === 0 || value === "") return "-";
	const timestamp = typeof value === "number" ? value : Number(value);
	return Number.isNaN(timestamp) ? "-" : dayjs(timestamp).format("YYYY-MM-DD");
}

export function toDateRangeParam(start?: string, end?: string): string | undefined {
	if (start != null && end != null) {
		return `${start},${end}`;
	}
	return start ?? end;
}

export function toNumberArray(value: number | number[] | undefined): number[] {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}

export function normalizeBrandModelSeries(value: unknown): string | undefined {
	if (Array.isArray(value) && value.length > 0) {
		return value.map((item) => String(item)).join(",");
	}
	if (!Array.isArray(value) && value != null && value !== "") {
		return String(value);
	}
	return undefined;
}

type ListRequestBase = Record<string, unknown> & {
	page?: number;
	pageSize?: number;
	shootDateStart?: string;
	shootDateEnd?: string;
};

export function buildMaterialListBaseParams(params: ListRequestBase): {
	page: number;
	pageSize: number;
	shootDate?: string;
	rest: Record<string, unknown>;
} {
	const { page = 1, pageSize = MATERIAL_PAGE_SIZE, shootDateStart, shootDateEnd, ...rest } = params;
	const shootDate = toDateRangeParam(shootDateStart, shootDateEnd);
	return { page, pageSize, shootDate, rest };
}

export function assignNormalizedBrandModelSeries(
	params: Record<string, unknown>,
	fieldName = "brandModelSeries",
): Record<string, unknown> {
	const next = { ...params };
	const normalized = normalizeBrandModelSeries(next[fieldName]);
	if (fieldName in next) {
		delete next[fieldName];
	}
	if (normalized) {
		next[fieldName] = normalized;
	}
	return next;
}

export function sanitizeQueryParams<T extends Record<string, unknown>>(params: T): Partial<T> {
	const next: Partial<T> = {};
	for (const [key, value] of Object.entries(params) as Array<[keyof T, T[keyof T]]>) {
		if (value == null) continue;
		if (typeof value === "string" && value.trim() === "") continue;
		if (Array.isArray(value) && value.length === 0) continue;
		next[key] = value;
	}
	return next;
}

export function transformMaterialListResponse(raw: unknown): {
	list: MaterialRow[];
	total: number;
} {
	const data = raw as { list?: MaterialRow[]; total?: number };
	return { list: data.list ?? [], total: data.total ?? 0 };
}

export function getRequestErrorMessage(error: unknown, fallback: string): string {
	return getApiErrorMessage(error, fallback);
}

type CommonApiResult = {
	code?: number;
	message?: string;
	msg?: string;
};

export function ensureApiSuccess(result: unknown, fallback: string): void {
	const parsed = (result ?? {}) as CommonApiResult;
	if (typeof parsed.code === "number" && parsed.code !== 0) {
		throw new Error(parsed.message || parsed.msg || fallback);
	}
}

export function renderCarModelLines(info: MaterialRow["carModelInfo"]): ReactNode {
	if (!info) return "-";
	const text = [info.brandName, info.seriesName, info.carName].filter(Boolean).join(" / ");
	return text || "-";
}

export type CarModelCascaderOption = {
	value: number;
	label: string;
	children?: CarModelCascaderOption[];
};

export function toModelCascaderOptions(list: CarModelTreeNode[]): CarModelCascaderOption[] {
	return list.map((subBrand) => ({
		value: subBrand.subBrandId,
		label: subBrand.subBrandName,
		children: (subBrand.seriesList ?? []).map((series) => ({
			value: series.seriesId,
			label: series.seriesName,
			children: (series.carModels ?? []).map((model) => ({
				value: model.carId,
				label: model.carName,
			})),
		})),
	}));
}

export async function downloadMaterial(
	row: MaterialRow,
	getDownloadUrl: (row: MaterialRow) => Promise<string>,
): Promise<void> {
	try {
		const url = await getDownloadUrl(row);
		if (!url) return;

		const fileName = row.name || DEFAULT_DOWNLOAD_FILE_NAME;
		const randomParam = `t=${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
		const cacheBustingUrl = `${url}${url.includes("?") ? "&" : "?"}${randomParam}`;

		try {
			const response = await axios.get(cacheBustingUrl, {
				responseType: "blob",
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			});

			const blob = new Blob([response.data], {
				type: response.data.type || "video/mp4",
			});
			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.style.display = "none";
			link.href = blobUrl;
			link.setAttribute("download", fileName);
			document.body.appendChild(link);
			link.click();

			setTimeout(() => {
				document.body.removeChild(link);
				window.URL.revokeObjectURL(blobUrl);
			}, DOWNLOAD_CLEANUP_DELAY_MS);
		} catch {
			const link = document.createElement("a");
			link.href = cacheBustingUrl;
			link.setAttribute("download", fileName);
			link.target = "_blank";
			link.click();
		} finally {
			await materialService.downloadSucceed({ id: row.id });
		}
	} catch {
		// 错误由 apiClient 统一处理
	}
}

export async function downloadMaterialsInBatch(
	rows: MaterialRow[],
	getDownloadUrl: (row: MaterialRow) => Promise<string>,
	delayMs = 500,
): Promise<void> {
	for (const row of rows) {
		await downloadMaterial(row, getDownloadUrl);
		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
}
