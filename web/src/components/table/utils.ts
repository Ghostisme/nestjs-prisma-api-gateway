import dayjs from "dayjs";
import type { TableColumn } from "./types";

type ColumnKey = string | number;

const defaultNumberFormatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });

export const getValueByPath = (record: Record<string, any>, dataIndex: TableColumn<any>["dataIndex"]) => {
	if (Array.isArray(dataIndex)) {
		return dataIndex.reduce((acc, key) => (acc ? acc[key] : undefined), record);
	}
	return record?.[dataIndex];
};

export const formatValue = (
	value: unknown,
	format?: TableColumn<any>["format"],
	statusMap?: TableColumn<any>["statusMap"],
) => {
	if (value === null || value === undefined || value === "") return "-";
	if (!format) return value;
	if (format === "date")
		return dayjs(value as string).isValid() ? dayjs(value as string).format("YYYY-MM-DD HH:mm:ss") : value;
	if (format === "currency") return `¥ ${defaultNumberFormatter.format(Number(value))}`;
	if (format === "percentage") return `${defaultNumberFormatter.format(Number(value))}%`;
	if (format === "status") return statusMap?.[value as ColumnKey] ?? value;
	return value;
};

export const buildTableData = <T>(raw: unknown, transform?: (data: unknown) => { list: T[]; total: number } | T[]) => {
	if (transform) {
		const result = transform(raw);
		if (Array.isArray(result)) return { list: result, total: result.length };
		return result;
	}
	if (Array.isArray(raw)) return { list: raw, total: raw.length };
	if (raw && typeof raw === "object") {
		const dataObj = raw as Record<string, unknown>;
		const list = (dataObj.list || dataObj.data || dataObj.records) as T[] | undefined;
		const total = (dataObj.total as number | undefined) ?? (Array.isArray(list) ? list.length : 0);
		if (Array.isArray(list)) return { list, total };
	}
	return { list: [], total: 0 };
};

const escapeCsvValue = (value: unknown) => {
	if (value === null || value === undefined) return "";
	const text = String(value);
	if (text.includes(",") || text.includes("\n") || text.includes('"')) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
};

export const exportCsv = <T>(columns: TableColumn<T>[], data: T[], fileName: string) => {
	const visibleColumns = columns.filter((col) => !col.hideInTable);
	const header = visibleColumns.map((col) => escapeCsvValue(col.title)).join(",");
	const rows = data.map((record) => {
		return visibleColumns
			.map((col) => {
				const rawValue = getValueByPath(record as Record<string, any>, col.dataIndex);
				const formatted = formatValue(rawValue, col.format, col.statusMap);
				return escapeCsvValue(formatted);
			})
			.join(",");
	});
	const csvContent = [header, ...rows].join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(link.href);
};
