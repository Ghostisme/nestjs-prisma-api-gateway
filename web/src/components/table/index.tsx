import {
	Button,
	Cascader,
	Checkbox,
	DatePicker,
	Form,
	Grid,
	Input,
	InputNumber,
	Modal,
	Pagination,
	Popconfirm,
	Popover,
	Select,
	Space,
	Spin,
	Switch,
	Table,
	Tooltip,
	TreeSelect,
	Tag,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import dayjs from "dayjs";
import type { CSSProperties, MutableRefObject, ReactNode } from "react";
import { BrandTreeSelect } from "@/components/BrandTreeSelect";
import { BrandSelect } from "@/components/brandSelect";
import { useMediaQuery } from "@/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import screenfull from "screenfull";
import { Icon } from "@/components/icon";
import { cn } from "@/utils";
import styles from "./index.module.css";
import type {
	ContentSlotContext,
	ResponsiveSearchValue,
	SearchBreakpoint,
	SearchConfig,
	SearchFieldConfig,
	SearchResponsiveConfig,
	TableAction,
	TableColumn,
	TableConfig,
} from "./types";
import { buildTableData, exportCsv, formatValue, getValueByPath } from "./utils";

type ConfigTableProps<T> = {
	config: TableConfig<T>;
	actionRef?: MutableRefObject<TableAction | null>;
};

type SorterState = {
	sortField?: string | number | bigint | ReadonlyArray<string | number | bigint>;
	sortOrder?: "ascend" | "descend" | null;
};

type SearchOptionValue = string | number | null;
type SearchOption = { label: string; value: SearchOptionValue };

type TagMultiSelectProps = {
	options?: SearchOption[];
	value?: SearchOptionValue[];
	onChange?: (value: SearchOptionValue[]) => void;
	maxVisibleRows?: number;
};

const TAG_ITEM_HEIGHT = 28;
const TAG_ITEM_GAP = 8;
const DEFAULT_TAG_MAX_VISIBLE_ROWS = 2;

function TagMultiSelect({
	options = [],
	value = [],
	onChange,
	maxVisibleRows = DEFAULT_TAG_MAX_VISIBLE_ROWS,
}: TagMultiSelectProps) {
	const selectedValues = Array.isArray(value) ? value : [];
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [expanded, setExpanded] = useState(false);
	const [hasOverflow, setHasOverflow] = useState(false);
	const normalizedMaxVisibleRows =
		typeof maxVisibleRows === "number" && maxVisibleRows > 0 ? maxVisibleRows : DEFAULT_TAG_MAX_VISIBLE_ROWS;
	const collapsedMaxHeight = TAG_ITEM_HEIGHT * normalizedMaxVisibleRows + TAG_ITEM_GAP * (normalizedMaxVisibleRows - 1);

	const detectOverflow = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;
		setHasOverflow(container.scrollHeight > collapsedMaxHeight + 1);
	}, [collapsedMaxHeight]);

	useEffect(() => {
		detectOverflow();
		const container = containerRef.current;
		if (!container || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(() => detectOverflow());
		observer.observe(container);
		return () => observer.disconnect();
	}, [detectOverflow, options]);

	useEffect(() => {
		setExpanded(false);
	}, [options, normalizedMaxVisibleRows]);

	const toggle = (optionValue: SearchOptionValue, checked: boolean) => {
		const next = checked
			? [...selectedValues, optionValue]
			: selectedValues.filter((selected) => selected !== optionValue);
		onChange?.(next);
	};

	return (
		<div className="flex w-full items-end justify-between gap-4">
			<div
				ref={containerRef}
				className="flex flex-1 flex-wrap gap-2 overflow-hidden"
				style={expanded ? undefined : { maxHeight: `${collapsedMaxHeight}px` }}
			>
				{options.map((option) => {
					const checked = selectedValues.includes(option.value);
					return (
						<Tag.CheckableTag
							key={String(option.value)}
							checked={checked}
							onChange={(nextChecked) => toggle(option.value, nextChecked)}
							className={cn(
								"m-0! rounded! px-3! text-xs! leading-6.5!",
								checked
									? "border-(--ant-color-primary)! bg-[#eaf3ff]! text-(--ant-color-primary)!"
									: "border-transparent! bg-[#f5f5f5]! text-[#595959]!",
							)}
						>
							{option.label}
						</Tag.CheckableTag>
					);
				})}
			</div>
			{hasOverflow && (
				<button
					type="button"
					className="shrink-0 inline-flex items-center gap-1 text-xs text-[#1677ff] hover:text-[#4096ff]"
					onClick={() => setExpanded((prev) => !prev)}
				>
					{expanded ? (
						<>
							Collapse tags
							<Icon icon="solar:alt-arrow-up-linear" className="text-sm" />
						</>
					) : (
						<>
							Expand tags
							<Icon icon="solar:alt-arrow-down-linear" className="text-sm" />
						</>
					)}
				</button>
			)}
		</div>
	);
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DATETIME_FORMAT_FULL = "YYYY-MM-DD HH:mm:ss";
const DEFAULT_SEARCH_COLUMNS = 1;
const DEFAULT_SEARCH_GAP = 16;
const SEARCH_BREAKPOINT_ORDER: SearchBreakpoint[] = ["xs", "sm", "md", "lg", "xl", "xxl", "xxxl"];

const clampSearchCount = (value?: number) => {
	if (typeof value !== "number" || Number.isNaN(value)) return undefined;
	return Math.min(6, Math.max(1, Math.floor(value)));
};

const getActiveSearchBreakpoint = (screens: Partial<Record<SearchBreakpoint | "xxl", boolean>>): SearchBreakpoint => {
	if (screens.xxxl) return "xxxl";
	if (screens.xxl) return "xxl";
	if (screens.xl) return "xl";
	if (screens.lg) return "lg";
	if (screens.md) return "md";
	if (screens.sm) return "sm";
	return "xs";
};

const isResponsiveSearchMap = <T,>(value?: ResponsiveSearchValue<T>): value is Partial<Record<SearchBreakpoint, T>> =>
	Boolean(value) &&
	typeof value === "object" &&
	!Array.isArray(value) &&
	SEARCH_BREAKPOINT_ORDER.some((breakpoint) => breakpoint in (value as object));

const resolveResponsiveSearchValue = <T,>(
	value: ResponsiveSearchValue<T> | undefined,
	breakpoint: SearchBreakpoint,
) => {
	if (!isResponsiveSearchMap(value)) return value;
	let resolved: T | undefined;
	for (const currentBreakpoint of SEARCH_BREAKPOINT_ORDER) {
		if (value[currentBreakpoint] !== undefined) {
			resolved = value[currentBreakpoint];
		}
		if (currentBreakpoint === breakpoint) break;
	}
	return resolved;
};

const normalizeResponsiveSearchConfig = (
	search?: SearchConfig,
): Partial<Record<SearchBreakpoint, SearchResponsiveConfig>> => {
	const normalized: Partial<Record<SearchBreakpoint, SearchResponsiveConfig>> = {
		xs: {
			layout: search?.layout ?? "vertical",
			gap: search?.grid?.gap ?? search?.gap ?? DEFAULT_SEARCH_GAP,
			actionsPlacement: "bottom",
			actionsDirection: search?.isButtonHorizontal ? "horizontal" : "vertical",
		},
		lg: {
			actionsPlacement: "right",
		},
	};

	if (search?.grid) {
		const columnsByBreakpoint: Partial<Record<SearchBreakpoint, number | undefined>> = {
			xs: search.grid.columns,
			md: search.grid.md,
			lg: search.grid.lg,
			xl: search.grid.xl,
			xxl: search.grid.xxl,
			xxxl: search.grid.xxxl,
		};

		for (const breakpoint of SEARCH_BREAKPOINT_ORDER) {
			const columns = clampSearchCount(columnsByBreakpoint[breakpoint]);
			if (columns === undefined) continue;
			normalized[breakpoint] = {
				...(normalized[breakpoint] ?? {}),
				columns,
			};
		}
	}

	if (!search?.responsive) return normalized;

	for (const breakpoint of SEARCH_BREAKPOINT_ORDER) {
		const breakpointConfig = search.responsive[breakpoint];
		if (!breakpointConfig) continue;
		normalized[breakpoint] = {
			...(normalized[breakpoint] ?? {}),
			...breakpointConfig,
			columns: clampSearchCount(breakpointConfig.columns) ?? normalized[breakpoint]?.columns,
		};
	}

	return normalized;
};

const resolveResponsiveSearchConfig = (
	responsiveConfig: Partial<Record<SearchBreakpoint, SearchResponsiveConfig>>,
	breakpoint: SearchBreakpoint,
) => {
	let layout: SearchResponsiveConfig["layout"] = "vertical";
	let gap = DEFAULT_SEARCH_GAP;
	let columns = DEFAULT_SEARCH_COLUMNS;
	let actionsPlacement: SearchResponsiveConfig["actionsPlacement"] = "bottom";
	let actionsDirection: SearchResponsiveConfig["actionsDirection"] = "vertical";

	for (const currentBreakpoint of SEARCH_BREAKPOINT_ORDER) {
		const currentConfig = responsiveConfig[currentBreakpoint];
		if (currentConfig) {
			layout = currentConfig.layout ?? layout;
			gap = currentConfig.gap ?? gap;
			columns = clampSearchCount(currentConfig.columns) ?? columns;
			actionsPlacement = currentConfig.actionsPlacement ?? actionsPlacement;
			actionsDirection = currentConfig.actionsDirection ?? actionsDirection;
		}
		if (currentBreakpoint === breakpoint) break;
	}

	return {
		layout,
		gap,
		columns,
		actionsPlacement,
		actionsDirection,
	};
};

const resolveSearchFieldSpan = (field: SearchFieldConfig, breakpoint: SearchBreakpoint, columns: number) => {
	const isWideField = field.type === "daterange" || field.type === "numberRange";
	const spanFromResponsiveConfig = clampSearchCount(resolveResponsiveSearchValue(field.span, breakpoint));
	const fallbackSpan = clampSearchCount(field.gridSpan ?? (isWideField ? 2 : 1)) ?? 1;
	return Math.min(columns, spanFromResponsiveConfig ?? fallbackSpan);
};

const getColumnKey = <T,>(column: TableColumn<T>) => {
	if (column.key) return column.key;
	if (Array.isArray(column.dataIndex)) return column.dataIndex.join(".");
	return column.dataIndex;
};

const normalizeSortField = (field?: SorterState["sortField"]) => {
	if (Array.isArray(field)) return field.join(".");
	if (typeof field === "string" || typeof field === "number" || typeof field === "bigint") return String(field);
	return "";
};

const compareValues = (left: unknown, right: unknown) => {
	if (left == null && right == null) return 0;
	if (left == null) return -1;
	if (right == null) return 1;
	if (typeof left === "number" && typeof right === "number") return left - right;
	const leftNumber = Number(left);
	const rightNumber = Number(right);
	if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
		return leftNumber - rightNumber;
	}
	const leftTime = Date.parse(String(left));
	const rightTime = Date.parse(String(right));
	if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
		return leftTime - rightTime;
	}
	return String(left).localeCompare(String(right));
};

const normalizeDateValue = (value: unknown): dayjs.Dayjs | undefined => {
	if (value == null || value === "") return undefined;
	if (dayjs.isDayjs(value)) return value;
	const parsed = dayjs(value as string | number | Date);
	return parsed.isValid() ? parsed : undefined;
};

const normalizeRangeValue = (value: unknown) => {
	if (!Array.isArray(value)) return value;
	const start = normalizeDateValue(value[0]);
	const end = normalizeDateValue(value[1]);
	if (!start && !end) return undefined;
	const startDay = start ?? null;
	const endDay = end ?? null;
	if (startDay && endDay && startDay.isSame(endDay, "day")) {
		return [startDay.startOf("day"), endDay.endOf("day")];
	}
	return [start ?? null, end ?? null];
};

const normalizeSearchValues = (fields: SearchFieldConfig[], values: Record<string, unknown>) => {
	const normalized: Record<string, unknown> = { ...values };
	for (const field of fields) {
		if (field.type === "date" && field.name in normalized) {
			normalized[field.name] = normalizeDateValue(normalized[field.name]);
		}
		if (field.type === "daterange" && field.name in normalized) {
			normalized[field.name] = normalizeRangeValue(normalized[field.name]);
		}
		if (field.type === "selectMultiQuery" && field.name in normalized) {
			const val = normalized[field.name];
			if (val != null && val !== "") {
				normalized[field.name] = Array.isArray(val) ? val : [val];
			}
		}
		if (field.type === "multiTreeSelect" && field.name in normalized) {
			const val = normalized[field.name];
			if (val != null && !Array.isArray(val)) {
				normalized[field.name] = [val];
			}
		}
		if (
			field.type === "brandTreeSelect" &&
			(field.props as { multiple?: boolean })?.multiple &&
			field.name in normalized
		) {
			const val = normalized[field.name];
			if (val != null && !Array.isArray(val)) {
				normalized[field.name] = [val];
			}
		}
	}
	return normalized;
};

const getDateValueProps = (field: SearchFieldConfig) => {
	if (field.type === "date") {
		return (value: unknown) => ({ value: normalizeDateValue(value) });
	}
	if (field.type === "daterange") {
		return (value: unknown) => ({ value: normalizeRangeValue(value) });
	}
	return undefined;
};

const getDateRangeFormat = (field: SearchFieldConfig): string => {
	const format = field.props?.format;
	if (typeof format === "string" && format.trim()) {
		return format;
	}
	if (Array.isArray(format)) {
		const firstStringFormat = format.find((item) => typeof item === "string" && item.trim());
		if (typeof firstStringFormat === "string") {
			return firstStringFormat;
		}
	}
	return DEFAULT_DATETIME_FORMAT_FULL;
};

const renderSearchField = (field: SearchFieldConfig) => {
	const placeholder = field.placeholder ?? "Enter…";
	const props = field.props ?? {};
	if (field.type === "select" || field.type === "multiSelect" || field.type === "selectMultiQuery") {
		const { displayAsTagList, tagListMaxVisibleRows, ...selectProps } = props as {
			displayAsTagList?: boolean;
			tagListMaxVisibleRows?: number;
			[key: string]: unknown;
		};
		if (field.type === "multiSelect" && displayAsTagList) {
			return (
				<TagMultiSelect options={field.options as SearchOption[] | undefined} maxVisibleRows={tagListMaxVisibleRows} />
			);
		}
		return (
			<Select
				placeholder={field.placeholder ?? "Select"}
				options={field.options}
				mode={field.type === "multiSelect" ? "multiple" : undefined}
				optionFilterProp="label"
				allowClear
				{...selectProps}
			/>
		);
	}
	if (field.type === "brandSelect") {
		return <BrandSelect placeholder={field.placeholder ?? "Select"} {...props} />;
	}
	if (field.type === "brandTreeSelect") {
		const {
			showSearch = true,
			showScrollBar = true,
			allowClear = true,
			treeDefaultExpandAll = false,
			multiple = false,
			...restProps
		} = props as Record<string, unknown> & {
			showSearch?: boolean;
			showScrollBar?: boolean;
			allowClear?: boolean;
			treeDefaultExpandAll?: boolean;
			multiple?: boolean;
		};
		return (
			<BrandTreeSelect
				placeholder={field.placeholder ?? "Select brand/series"}
				showSearch={showSearch}
				showScrollBar={showScrollBar}
				allowClear={allowClear}
				treeDefaultExpandAll={treeDefaultExpandAll}
				multiple={multiple}
				{...restProps}
			/>
		);
	}
	if (field.type === "date") {
		const dateProps = { ...props };
		if ("value" in dateProps) {
			dateProps.value = normalizeDateValue(dateProps.value);
		}
		if ("defaultValue" in dateProps) {
			dateProps.defaultValue = normalizeDateValue(dateProps.defaultValue);
		}
		return <DatePicker className="w-full" placeholder={field.placeholder ?? "Select"} {...dateProps} />;
	}
	if (field.type === "daterange") {
		const rangeProps = { ...props };
		if (!("format" in rangeProps)) {
			rangeProps.format = DEFAULT_DATETIME_FORMAT_FULL;
		}
		if ("value" in rangeProps) {
			rangeProps.value = normalizeRangeValue(rangeProps.value);
		}
		if ("defaultValue" in rangeProps) {
			rangeProps.defaultValue = normalizeRangeValue(rangeProps.defaultValue);
		}
		return <DatePicker.RangePicker className="w-full" placeholder={["Start time", "End time"]} {...rangeProps} />;
	}
	if (field.type === "number") {
		return <InputNumber className="w-full" placeholder={placeholder} {...props} />;
	}
	if (field.type === "cascader") {
		return <Cascader placeholder={field.placeholder ?? "Select"} options={field.options} {...props} />;
	}
	if (field.type === "treeSelect" || field.type === "multiTreeSelect") {
		const isMultiple = field.type === "multiTreeSelect";
		return (
			<TreeSelect
				className="w-full"
				placeholder={field.placeholder ?? "Select"}
				treeData={field.treeData}
				showSearch
				showScrollBar
				allowClear
				treeDefaultExpandAll
				multiple={isMultiple}
				// treeCheckable={isMultiple}
				showCheckedStrategy={isMultiple ? TreeSelect.SHOW_CHILD : undefined}
				maxTagCount={isMultiple ? "responsive" : undefined}
				{...props}
			/>
		);
	}
	if (field.type === "switch") {
		return <Switch {...props} />;
	}
	if (field.type === "checkbox") {
		return <Checkbox {...props}>{field.label}</Checkbox>;
	}
	return <Input placeholder={placeholder} allowClear {...props} />;
};

export default function ConfigTable<T>({ config, actionRef }: ConfigTableProps<T>) {
	const {
		dataSource,
		columns: columnsProp,
		search,
		toolbar,
		rowActions,
		batchActions,
		pagination,
		paginationMode = "auto",
		sortMode = "client",
		expandable,
		zebra = false,
		containerClassName,
		containerStyle,
		rowSelection: rowSelectionConfig,
		events,
		slots,
		render,
		...tableProps
	} = config;
	const columns = useMemo(() => columnsProp ?? [], [columnsProp]);

	const {
		size = "middle",
		bordered = false,
		scroll,
		sticky = false,
		rowKey = "id",
		className,
		style,
		rowClassName: rowClassNameProp,
		onChange: onChangeProp,
		onRow: onRowProp,
		locale: localeProp,
		...restTableProps
	} = tableProps;

	const paginationConfig = pagination === false ? undefined : pagination;
	const [form] = Form.useForm();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(paginationConfig?.pageSize ?? DEFAULT_PAGE_SIZE);
	const [tableSize, setTableSize] = useState(size);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<T[]>(dataSource?.data ?? []);
	const [total, setTotal] = useState(dataSource?.data?.length ?? 0);
	const [searchValues, setSearchValues] = useState<Record<string, unknown>>({});
	// 搜索版本号：即使搜索条件不变，也能通过递增版本号强制触发一次刷新
	const [searchVersion, setSearchVersion] = useState(0);
	const [isExpanded, setIsExpanded] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [selectedRows, setSelectedRows] = useState<T[]>([]);
	const [visibleColumnKeys, setVisibleColumnKeys] = useState<React.Key[]>(
		columns.filter((col) => !col.hideInTable).map((col) => getColumnKey(col)),
	);
	const [isSearchCacheReady, setIsSearchCacheReady] = useState(!search?.cacheKey);
	const [sorterState, setSorterState] = useState<SorterState>({});
	const [filterState, setFilterState] = useState<Record<string, unknown>>({});
	const containerRef = useRef<HTMLDivElement>(null);
	const lastErrorRef = useRef<string | null>(null);
	const loadDataRef = useRef<((params?: Record<string, unknown>) => Promise<void>) | null>(null);

	const hasRemoteData = Boolean(dataSource?.api);
	const effectivePaginationMode = paginationMode === "auto" ? (hasRemoteData ? "server" : "client") : paginationMode;
	const isServerMode = effectivePaginationMode === "server";
	const isClientMode = effectivePaginationMode === "client";
	const effectiveSortMode = sortMode === "auto" ? (hasRemoteData ? "server" : "client") : sortMode;
	const isServerSort = effectiveSortMode === "server";
	const isClientSort = effectiveSortMode === "client";

	const normalizedColumns = useMemo(() => {
		const filtered = columns.filter(
			(col) => !col.hideInTable && !col.selection && visibleColumnKeys.includes(getColumnKey(col)),
		);
		const activeSortField = normalizeSortField(sorterState.sortField);
		const mapped = filtered.map((col) => {
			const colKey = getColumnKey(col);
			const colDataIndexKey = normalizeSortField(col.dataIndex);
			const colKeyNormalized = normalizeSortField(col.key ?? colKey);
			const isActiveSort = Boolean(
				activeSortField && (activeSortField === colDataIndexKey || activeSortField === colKeyNormalized),
			);
			const column: ColumnsType<T>[number] = {
				title: col.title,
				dataIndex: col.dataIndex as string,
				key: colKey,
				width: col.width,
				align: col.align ?? "center",
				fixed: col.fixed,
				ellipsis: col.ellipsis,
				sorter: col.sorter ?? col.sorterFn ?? col.sortable,
				sortOrder: col.sortOrder ?? (isActiveSort ? (sorterState.sortOrder ?? undefined) : undefined),
				filters: col.filterable ? [] : undefined,
				render: (value: unknown, record: T, index: number) => {
					const rawValue = getValueByPath(record as Record<string, any>, col.dataIndex);
					const rendered = (
						col.render ? col.render(value, record, index) : formatValue(rawValue, col.format, col.statusMap)
					) as ReactNode;
					if (col.tooltip) {
						const tooltipContent = (
							typeof col.tooltip === "function" ? col.tooltip(value, record, index) : rendered
						) as ReactNode;
						return (
							<Tooltip title={tooltipContent}>
								<span className="inline-flex max-w-full truncate">{rendered}</span>
							</Tooltip>
						);
					}
					return rendered;
				},
			};
			return column;
		});
		if (rowActions?.length) {
			mapped.push({
				title: "Actions",
				key: "__row_actions__",
				width: 200,
				align: "left",
				fixed: "right",
				render: (_: unknown, record: T) => {
					return (
						<Space size={12}>
							{rowActions
								.filter((action) =>
									typeof action.visible === "function" ? action.visible(record) : action.visible !== false,
								)
								.map((action) => {
									const isDisabled = typeof action.disabled === "function" ? action.disabled(record) : action.disabled;
									if (action.confirm) {
										return (
											<Popconfirm
												key={action.text}
												title={action.confirm.title}
												description={action.confirm.content}
												onConfirm={() => action.onClick?.(record)}
											>
												<Button
													key={action.text}
													type="link"
													className="p-0"
													danger={action.type === "danger"}
													disabled={isDisabled}
												>
													{action.icon}
													{action.text}
												</Button>
											</Popconfirm>
										);
									}
									return (
										<Button
											key={action.text}
											type="link"
											className="p-0"
											danger={action.type === "danger"}
											disabled={isDisabled}
											onClick={() => action.onClick?.(record)}
										>
											{action.icon}
											{action.text}
										</Button>
									);
								})}
						</Space>
					);
				},
			});
		}
		return mapped;
	}, [columns, rowActions, sorterState.sortField, sorterState.sortOrder, visibleColumnKeys]);

	const searchFields = useMemo(
		() =>
			search?.fields?.filter((field) => !columns.some((col) => col.dataIndex === field.name && col.hideInSearch)) ?? [],
		[search?.fields, columns],
	);

	const loadData = useCallback(
		async (params?: Record<string, unknown>) => {
			// if (!dataSource?.api || !isServerMode) return;
			if (!dataSource?.api) return;

			// 客户端模式时，只在初始化时加载一次全量数据
			// if (isClientMode || (dataSource?.data && dataSource?.data.length > 0)) return;

			setLoading(true);
			setError(null);
			try {
				const requestParams: Record<string, unknown> = {
					// page: params?.page ?? page,
					// pageSize: params?.pageSize ?? pageSize,
					// 服务端分页时才传递分页参数
					...(isServerMode
						? {
								page: params?.page ?? page,
								pageSize: params?.pageSize ?? pageSize,
							}
						: {}),
					...dataSource.defaultParams,
					...searchValues,
					...(isServerSort ? sorterState : {}),
					...filterState,
					...params,
				};
				for (const field of searchFields) {
					if (field.type === "daterange" && field.submitAs && Array.isArray(requestParams[field.name])) {
						const [start, end] = requestParams[field.name] as [unknown, unknown];
						const dateRangeFormat = getDateRangeFormat(field);
						requestParams[field.submitAs.start] = start
							? dayjs(start as dayjs.Dayjs).format(dateRangeFormat)
							: undefined;
						requestParams[field.submitAs.end] = end ? dayjs(end as dayjs.Dayjs).format(dateRangeFormat) : undefined;
						delete requestParams[field.name];
					}
				}
				const raw = await dataSource.api(requestParams);
				const { list, total: nextTotal } = buildTableData<T>(raw, dataSource.transform);
				setData(list);
				setTotal(nextTotal);
				events?.onLoadSuccess?.(list);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Failed to load";
				setError(errorMessage);
				events?.onLoadError?.(err as Error);
			} finally {
				setLoading(false);
			}
		},
		[
			dataSource?.api,
			dataSource?.defaultParams,
			dataSource?.transform,
			events,
			filterState,
			isServerSort,
			isServerMode,
			page,
			pageSize,
			searchFields,
			searchValues,
			sorterState,
		],
	);

	const handleTableChange = useCallback<NonNullable<TableProps<T>["onChange"]>>((_pager, filters, sorter) => {
		setFilterState(filters as Record<string, unknown>);
		if (!Array.isArray(sorter) && sorter?.field) {
			const nextSorterState: SorterState = {
				sortField: sorter.field,
				sortOrder: sorter.order,
			};
			setSorterState(nextSorterState);
		} else {
			setSorterState({});
		}
	}, []);

	const mergedOnChange = useCallback<NonNullable<TableProps<T>["onChange"]>>(
		(pager, filters, sorter, extra) => {
			handleTableChange(pager, filters, sorter, extra);
			onChangeProp?.(pager, filters, sorter, extra);
		},
		[handleTableChange, onChangeProp],
	);

	type RowClassNameFn = Exclude<NonNullable<TableProps<T>["rowClassName"]>, string>;
	const mergedRowClassName = useCallback<RowClassNameFn>(
		(record, index) => {
			const zebraClass = zebra && typeof index === "number" && index % 2 === 1 ? "bg-muted/50" : "";
			const userClass = typeof rowClassNameProp === "function" ? rowClassNameProp(record, index, 0) : rowClassNameProp;
			return cn(zebraClass, userClass);
		},
		[rowClassNameProp, zebra],
	);

	const mergedOnRow = useCallback<NonNullable<TableProps<T>["onRow"]>>(
		(record, index) => {
			const baseProps = onRowProp?.(record, index) ?? {};
			const baseClick = baseProps.onClick;
			return {
				...baseProps,
				onClick: (event) => {
					events?.onRowClick?.(record, index ?? 0);
					baseClick?.(event);
				},
			};
		},
		[events, onRowProp],
	);

	const mergedLocale = useMemo<TableProps<T>["locale"]>(
		() => ({
			...localeProp,
			emptyText: slots?.empty?.() ?? localeProp?.emptyText,
		}),
		[localeProp, slots],
	);

	const handleSearch = () => {
		const values = form.getFieldsValue();
		const normalized = normalizeSearchValues(searchFields, values);
		setPage(1);
		setSearchValues(normalized);
		// 每次点击搜索都递增，确保同条件重复搜索也会触发请求
		setSearchVersion((prev) => prev + 1);
		if (search?.cacheKey) {
			sessionStorage.setItem(search.cacheKey, JSON.stringify(normalized));
		}
	};

	const handleSearchValuesChange = (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => {
		search?.onValuesChange?.(changedValues, allValues);
		const changedFieldNames = Object.keys(changedValues);
		const shouldSubmit = searchFields.some(
			(field) => field.submitOnChange && changedFieldNames.includes(field.name.split(".")[0] ?? field.name),
		);
		if (shouldSubmit) {
			handleSearch();
		}
	};

	const handleReset = () => {
		form.resetFields();
		setPage(1);
		setSearchValues({});
		setSearchVersion((prev) => prev + 1);
		if (search?.cacheKey) {
			sessionStorage.removeItem(search.cacheKey);
		}
		search?.onReset?.();
	};

	const handlePageChange = useCallback((nextPage: number, nextPageSize: number) => {
		setPage(nextPage);
		setPageSize(nextPageSize);
	}, []);

	const reloadTable = useCallback(
		(options?: { resetPage?: boolean }) => {
			const shouldResetPage = Boolean(options?.resetPage);
			if (shouldResetPage) {
				setPage(1);
			}
			if (hasRemoteData) {
				setSearchVersion((prev) => prev + 1);
				return;
			}
			const nextData = dataSource?.data ?? [];
			setData(nextData);
			setTotal(nextData.length);
		},
		[dataSource?.data, hasRemoteData],
	);

	const handleRefresh = useCallback(() => {
		reloadTable();
	}, [reloadTable]);

	const handleExport = useCallback(
		(format: "csv" | "excel") => {
			const fileName = toolbar?.export?.fileName ?? "table-data";
			const suffix = format === "excel" ? "csv" : format;
			exportCsv(columns, data, `${fileName}.${suffix}`);
		},
		[columns, data, toolbar?.export?.fileName],
	);

	const handleDensityChange = useCallback((nextSize: typeof size) => {
		setTableSize(nextSize ?? "middle");
	}, []);

	const handleFullscreen = useCallback(() => {
		if (!containerRef.current) return;
		if (screenfull.isEnabled) {
			screenfull.toggle(containerRef.current);
		}
	}, []);

	const rowSelection =
		columns.some((col) => col.selection) && rowSelectionConfig !== false
			? {
					selectedRowKeys,
					onChange: (keys: React.Key[], rows: T[]) => {
						setSelectedRowKeys(keys);
						setSelectedRows(rows);
						events?.onSelectionChange?.(rows);
					},
					...(rowSelectionConfig === true || !rowSelectionConfig ? {} : rowSelectionConfig),
				}
			: undefined;

	const columnSettingContent = (
		<Checkbox.Group
			className="flex flex-col gap-2"
			value={visibleColumnKeys}
			onChange={(keys) => setVisibleColumnKeys(keys as React.Key[])}
		>
			{columns
				.filter((col) => !col.hideInTable && !col.selection)
				.map((col) => (
					<Checkbox key={getColumnKey(col)} value={getColumnKey(col)}>
						{col.title}
					</Checkbox>
				))}
		</Checkbox.Group>
	);

	useEffect(() => {
		loadDataRef.current = loadData;
	}, [loadData]);

	const autoLoadSignature = useMemo(
		() =>
			JSON.stringify({
				page: isServerMode ? page : undefined,
				pageSize: isServerMode ? pageSize : undefined,
				defaultParams: dataSource?.defaultParams,
				searchValues,
				// 纳入自动加载签名，避免 searchValues 不变时无法触发 useEffect
				searchVersion,
				filterState,
				sorterState: isServerSort ? sorterState : undefined,
			}),
		[
			isServerMode,
			page,
			pageSize,
			dataSource?.defaultParams,
			searchValues,
			searchVersion,
			filterState,
			isServerSort,
			sorterState,
		],
	);

	const hasApi = Boolean(dataSource?.api);

	useEffect(() => {
		if (!hasApi || !isSearchCacheReady || !autoLoadSignature) return;
		void loadDataRef.current?.();
	}, [hasApi, isSearchCacheReady, autoLoadSignature]);

	useEffect(() => {
		if (!actionRef) return;
		actionRef.current = {
			reload: reloadTable,
			getSearchValues: () => searchValues,
		};
		return () => {
			actionRef.current = null;
		};
	}, [actionRef, reloadTable, searchValues]);

	// useEffect(() => {
	//   if (!isClientMode) return;
	//   const nextData = dataSource?.data ?? [];
	//   setData(nextData);
	//   setTotal(nextData.length);
	// }, [dataSource?.data, isClientMode]);
	useEffect(() => {
		// 只有没有 API 时才使用 dataSource.data
		if (!isClientMode || dataSource?.api) return;
		const nextData = dataSource?.data ?? [];
		setData(nextData);
		setTotal(nextData.length);
	}, [dataSource?.data, dataSource?.api, isClientMode]);

	useEffect(() => {
		if (!search?.cacheKey) {
			setIsSearchCacheReady(true);
			return;
		}
		setIsSearchCacheReady(false);
		const resetSearchState = () => {
			form.resetFields();
			setSearchValues({});
			setPage(1);
		};
		const raw = sessionStorage.getItem(search.cacheKey);
		if (!raw) {
			resetSearchState();
			setIsSearchCacheReady(true);
			return;
		}
		try {
			const cached = JSON.parse(raw) as Record<string, unknown>;
			form.setFieldsValue(cached);
			setSearchValues(cached);
			setPage(1);
		} catch {
			resetSearchState();
			sessionStorage.removeItem(search.cacheKey);
		}
		setIsSearchCacheReady(true);
	}, [search?.cacheKey, form]);

	useEffect(() => {
		if (!error || error === lastErrorRef.current) return;
		lastErrorRef.current = error;
		Modal.error({
			title: "Request error",
			content: error,
		});
	}, [error]);

	const sortedData = useMemo(() => {
		const sourceData = isServerMode ? data : (dataSource?.data ?? data);
		if (!isClientSort) return sourceData;
		if (!sorterState.sortField || !sorterState.sortOrder) return sourceData;
		const activeSortField = normalizeSortField(sorterState.sortField);
		const activeColumn = columns.find((col) => {
			const dataIndexKey = normalizeSortField(col.dataIndex);
			const colKey = normalizeSortField(col.key ?? getColumnKey(col));
			return activeSortField === dataIndexKey || activeSortField === colKey;
		});
		if (!activeColumn) return sourceData;
		const sortFn =
			activeColumn.sorterFn ||
			(typeof activeColumn.sorter === "function" ? activeColumn.sorter : undefined) ||
			((left: T, right: T) => {
				const leftValue = getValueByPath(left as Record<string, any>, activeColumn.dataIndex);
				const rightValue = getValueByPath(right as Record<string, any>, activeColumn.dataIndex);
				return compareValues(leftValue, rightValue);
			});
		const direction = sorterState.sortOrder === "descend" ? -1 : 1;
		return [...sourceData].sort((left, right) => sortFn(left, right) * direction);
	}, [columns, data, dataSource?.data, isClientSort, isServerMode, sorterState.sortField, sorterState.sortOrder]);

	const tableData = useMemo(() => {
		if (pagination === false || !isClientMode) return sortedData;
		const start = (page - 1) * pageSize;
		return sortedData.slice(start, start + pageSize);
	}, [isClientMode, page, pageSize, pagination, sortedData]);

	const tableTotal = isServerMode ? total : (dataSource?.data ?? data).length;

	const screens = Grid.useBreakpoint();
	const isXxxlScreen = useMediaQuery("(min-width: 1680px)");
	const activeSearchBreakpoint = getActiveSearchBreakpoint({
		...screens,
		xxxl: isXxxlScreen,
	});
	const normalizedResponsiveSearchConfig = useMemo(() => normalizeResponsiveSearchConfig(search), [search]);
	const resolvedResponsiveSearchConfig = useMemo(
		() => resolveResponsiveSearchConfig(normalizedResponsiveSearchConfig, activeSearchBreakpoint),
		[activeSearchBreakpoint, normalizedResponsiveSearchConfig],
	);
	const shouldUseResponsiveSearchGrid = Boolean(search?.grid || search?.responsive);
	const searchFormLayout = shouldUseResponsiveSearchGrid
		? resolvedResponsiveSearchConfig.layout
		: (search?.layout ?? "vertical");
	const searchFieldsContainerStyle = shouldUseResponsiveSearchGrid
		? ({
				display: "grid",
				gridTemplateColumns: `repeat(${resolvedResponsiveSearchConfig.columns}, minmax(0, 1fr))`,
				gap: `${resolvedResponsiveSearchConfig.gap}px`,
			} satisfies CSSProperties)
		: ({
				gap: `${search?.gap ?? DEFAULT_SEARCH_GAP}px`,
			} satisfies CSSProperties);
	const searchSectionClassName = shouldUseResponsiveSearchGrid
		? resolvedResponsiveSearchConfig.actionsPlacement === "right"
			? "flex items-start justify-between gap-6"
			: "flex flex-col gap-4"
		: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6";
	const searchActionsClassName = shouldUseResponsiveSearchGrid
		? resolvedResponsiveSearchConfig.actionsPlacement === "right"
			? "flex shrink-0 flex-col items-end gap-1.5 pt-0"
			: "flex flex-col items-stretch gap-1.5 pt-0"
		: "flex shrink-0 flex-col items-stretch gap-1.5 pt-0 lg:items-end";
	const searchActionsOrientation = shouldUseResponsiveSearchGrid
		? resolvedResponsiveSearchConfig.actionsDirection
		: search?.isButtonHorizontal
			? "horizontal"
			: "vertical";
	const searchExpandButtonClassName = shouldUseResponsiveSearchGrid
		? resolvedResponsiveSearchConfig.actionsPlacement === "right"
			? "p-0 self-end"
			: "p-0 self-start"
		: "p-0 self-start lg:self-end";
	const initialVisibleCount =
		typeof search?.initialVisibleCount === "number" && search.initialVisibleCount > 0
			? Math.floor(search.initialVisibleCount)
			: 6;

	const toolbarAlign = toolbar?.align ?? "right";
	const toolbarActions = toolbar?.customActions ?? [];
	const toolbarActionsNode = useMemo(
		() => (
			<div className="flex flex-wrap items-center gap-2">
				{toolbarActions.map((action) => {
					if (action.render) {
						return <span key={action.text}>{action.render(selectedRows)}</span>;
					}
					const disabled = typeof action.disabled === "function" ? action.disabled(selectedRows) : action.disabled;
					const isDisabled = action.requireSelection ? selectedRows.length === 0 || disabled : disabled;
					const buttonType = action.type ?? (action.ghost ? "primary" : undefined);
					return (
						<Button
							key={action.text}
							type={buttonType}
							danger={action.danger}
							ghost={action.ghost}
							loading={action.loading}
							size={action.size}
							shape={action.shape}
							block={action.block}
							iconPlacement={action.iconPosition}
							disabled={isDisabled}
							onClick={() => action.onClick?.(selectedRows)}
						>
							{action.icon}
							{action.text}
						</Button>
					);
				})}
				{toolbar?.refresh ? (
					<Button onClick={handleRefresh}>
						<Icon icon="mingcute:refresh-2-line" />
					</Button>
				) : null}
				{toolbar?.density ? (
					<Select
						value={tableSize}
						onChange={handleDensityChange}
						options={[
							{ label: "Compact", value: "small" },
							{ label: "Default", value: "middle" },
							{ label: "Loose", value: "large" },
						]}
						className="w-24"
					/>
				) : null}
				{toolbar?.fullscreen ? (
					<Button onClick={handleFullscreen}>
						<Icon icon="mingcute:fullscreen-line" />
					</Button>
				) : null}
				{toolbar?.columnSetting ? (
					<Popover content={columnSettingContent} trigger="click">
						<Button>
							<Icon icon="mingcute:column-line" />
						</Button>
					</Popover>
				) : null}
				{toolbar?.export?.enabled ? (
					<Button onClick={() => handleExport((toolbar.export?.formats?.[0] ?? "csv") as "csv" | "excel")}>Export</Button>
				) : null}
				{slots?.toolbarRight?.()}
			</div>
		),
		[
			columnSettingContent,
			handleExport,
			handleFullscreen,
			handleRefresh,
			handleDensityChange,
			selectedRows,
			slots,
			tableSize,
			toolbar?.columnSetting,
			toolbar?.density,
			toolbar?.export?.enabled,
			toolbar?.export?.formats,
			toolbar?.fullscreen,
			toolbar?.refresh,
			toolbarActions,
		],
	);

	const searchNode =
		search?.render || searchFields.length ? (
			<div className="rounded-xl border bg-card px-6 py-5">
				<Form
					form={form}
					layout={searchFormLayout}
					className="flex flex-col gap-4"
					onValuesChange={handleSearchValuesChange}
				>
					{search?.render ? (
						search.render({ fields: searchFields, form })
					) : (
						<div className={searchSectionClassName}>
							<div className="min-w-0 flex-1">
								<div
									className={cn(shouldUseResponsiveSearchGrid ? "" : "flex flex-wrap")}
									style={searchFieldsContainerStyle}
								>
									{searchFields
										.filter((_, index) => !search?.showAdvanced || isExpanded || index < initialVisibleCount)
										.map((field) => {
											const isWide = field.type === "daterange" || field.type === "numberRange";
											const isGridLayout = shouldUseResponsiveSearchGrid;
											const gridSpan = resolveSearchFieldSpan(
												field,
												activeSearchBreakpoint,
												resolvedResponsiveSearchConfig.columns,
											);
											const baseItemClassName = isGridLayout
												? "min-w-0"
												: isWide
													? "w-[360px] shrink-0"
													: "w-[240px] shrink-0";
											const itemStyle = isGridLayout
												? ({
														gridColumn: `span ${gridSpan} / span ${gridSpan}`,
														...(field.itemStyle ?? {}),
													} as React.CSSProperties)
												: field.itemStyle;
											return (
												<div key={field.name} className={cn(baseItemClassName, field.itemClassName)} style={itemStyle}>
													{field.type === "numberRange" ? (
														<Form.Item label={field.label} style={{ marginBottom: 0 }}>
															<Space.Compact className="w-full">
																<Form.Item
																	name={[field.name, "min"]}
																	noStyle
																	initialValue={(field.defaultValue as any)?.min}
																>
																	<InputNumber className="w-1/2" placeholder="Min" {...(field.props ?? {})} />
																</Form.Item>
																<Form.Item
																	name={[field.name, "max"]}
																	noStyle
																	initialValue={(field.defaultValue as any)?.max}
																>
																	<InputNumber className="w-1/2" placeholder="Max" {...(field.props ?? {})} />
																</Form.Item>
															</Space.Compact>
														</Form.Item>
													) : (
														<Form.Item
															label={field.type === "checkbox" ? "" : field.label}
															name={field.name}
															rules={field.rules}
															valuePropName={field.type === "switch" || field.type === "checkbox" ? "checked" : "value"}
															getValueProps={getDateValueProps(field)}
															initialValue={
																field.type === "daterange"
																	? normalizeRangeValue(field.defaultValue)
																	: field.type === "date"
																		? normalizeDateValue(field.defaultValue)
																		: field.defaultValue
															}
															style={{ marginBottom: 0 }}
														>
															{renderSearchField(field)}
														</Form.Item>
													)}
												</div>
											);
										})}
								</div>
							</div>
							<div className={searchActionsClassName}>
								<Space orientation={searchActionsOrientation} size={6}>
									<Button type="primary" onClick={handleSearch} icon={<Icon icon="ep:search" />}>
										{search?.searchButtonText ?? "Search"}
									</Button>
									<Button onClick={handleReset} icon={<Icon icon="mingcute:refresh-2-line" />}>
										{search?.resetButtonText ?? "Reset"}
									</Button>
								</Space>
								{search?.showAdvanced ? (
									<Button
										type="link"
										onClick={() => setIsExpanded((prev) => !prev)}
										className={searchExpandButtonClassName}
									>
										{isExpanded ? "Collapse" : "Expand"}
										<Icon icon={isExpanded ? "ep:arrow-up" : "ep:arrow-down"} className="ml-1 text-sm" />
									</Button>
								) : null}
							</div>
						</div>
					)}
				</Form>
			</div>
		) : null;

	const toolbarNode = useMemo(
		() =>
			toolbar?.render ? (
				toolbar.render({ selectedRows })
			) : (
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex flex-wrap items-center gap-2">
						{slots?.toolbarLeft?.()}
						{rowSelection && batchActions?.length ? (
							<Checkbox
								checked={
									tableData.length > 0 &&
									tableData.every((row) =>
										selectedRowKeys.includes((row as Record<string, React.Key>)[rowKey as string]),
									)
								}
								indeterminate={
									selectedRowKeys.length > 0 &&
									!tableData.every((row) =>
										selectedRowKeys.includes((row as Record<string, React.Key>)[rowKey as string]),
									)
								}
								onChange={(e) => {
									if (e.target.checked) {
										const keys = tableData.map((row) => (row as Record<string, React.Key>)[rowKey as string]);
										setSelectedRowKeys(keys);
										setSelectedRows(tableData);
									} else {
										setSelectedRowKeys([]);
										setSelectedRows([]);
									}
								}}
							>
								<span className="text-muted-foreground text-sm">
									Selected ({selectedRowKeys.length}/{tableData.length})
								</span>
							</Checkbox>
						) : null}
						{batchActions?.map((action) => {
							const disabled = action.disabled || (action.requireSelection && selectedRows.length === 0);
							const onSuccess = () => {
								setSelectedRowKeys([]);
								setSelectedRows([]);
							};
							if (action.confirm) {
								return (
									<Popconfirm
										key={action.text}
										title={action.confirm.title}
										description={action.confirm.content}
										onConfirm={() => action.onClick(selectedRows, onSuccess)}
									>
										<Button key={action.text} disabled={disabled}>
											{action.text}
										</Button>
									</Popconfirm>
								);
							}
							return (
								<Button key={action.text} disabled={disabled} onClick={() => action.onClick(selectedRows, onSuccess)}>
									{action.text}
								</Button>
							);
						})}
						{toolbarAlign === "left" ? toolbarActionsNode : null}
					</div>
					{toolbarAlign === "right" ? toolbarActionsNode : null}
				</div>
			),
		[
			batchActions,
			rowKey,
			rowSelection,
			selectedRowKeys,
			selectedRows,
			slots,
			tableData,
			toolbar,
			toolbarAlign,
			toolbarActionsNode,
		],
	);

	const hasFixedColumn = useMemo(() => normalizedColumns.some((col) => Boolean(col.fixed)), [normalizedColumns]);
	const computedScrollX = useMemo(() => {
		let totalWidth = 0;
		let hasWidth = false;
		for (const col of normalizedColumns) {
			if (typeof col.width === "number") {
				totalWidth += col.width;
				hasWidth = true;
				continue;
			}
			if (typeof col.width === "string" && col.width.endsWith("px")) {
				const parsed = Number.parseFloat(col.width);
				if (!Number.isNaN(parsed)) {
					totalWidth += parsed;
					hasWidth = true;
				}
			}
		}
		return hasWidth ? totalWidth : undefined;
	}, [normalizedColumns]);
	const mergedScroll = useMemo(() => {
		if (!scroll && !hasFixedColumn && !computedScrollX) return undefined;
		const nextScroll = scroll ? { ...scroll } : {};
		const hasExplicitScrollX = nextScroll.x !== undefined && nextScroll.x !== null;
		if (!hasExplicitScrollX || nextScroll.x === "max-content") {
			nextScroll.x = computedScrollX ?? "max-content";
		}
		return nextScroll;
	}, [scroll, hasFixedColumn, computedScrollX]);
	const isPaginationEnabled = pagination !== false;
	const paginationRangeStart = tableTotal === 0 ? 0 : (page - 1) * pageSize + 1;
	const paginationRangeEnd = Math.min(page * pageSize, tableTotal);
	const paginationShowTotal = isPaginationEnabled ? pagination?.showTotal : undefined;
	const paginationTotalNode = paginationShowTotal
		? paginationShowTotal(tableTotal, [paginationRangeStart, paginationRangeEnd])
		: null;
	const shouldUseFixedLayout = Boolean(mergedScroll?.x) || hasFixedColumn;
	const tableClassName = cn(styles.table, mergedScroll?.x === "max-content" && styles.maxContent, className);

	const handleSelectionChange = useCallback(
		(keys: React.Key[], rows: T[]) => {
			setSelectedRowKeys(keys);
			setSelectedRows(rows);
			events?.onSelectionChange?.(rows);
		},
		[events],
	);

	const contentSlotContext = useMemo(
		() => ({
			data: tableData,
			loading,
			total: tableTotal,
			page,
			pageSize,
			selectedRowKeys,
			selectedRows,
			onSelectionChange: rowSelection ? handleSelectionChange : undefined,
			isPaginationEnabled: isPaginationEnabled,
			onPageChange: handlePageChange,
			onRefresh: handleRefresh,
			paginationTotalNode: paginationTotalNode ?? null,
		}),
		[
			handlePageChange,
			handleRefresh,
			handleSelectionChange,
			isPaginationEnabled,
			loading,
			page,
			pageSize,
			paginationTotalNode,
			rowSelection,
			selectedRowKeys,
			selectedRows,
			tableData,
			tableTotal,
		],
	);

	const ContentComponent = slots?.content;
	const bodyNode = render ? (
		render(contentSlotContext)
	) : ContentComponent ? (
		<ContentComponent {...contentSlotContext} />
	) : (
		<Table
			{...restTableProps}
			className={tableClassName}
			style={style}
			rowKey={rowKey}
			size={tableSize}
			bordered={bordered}
			scroll={mergedScroll}
			sticky={sticky}
			tableLayout={shouldUseFixedLayout ? "fixed" : "auto"}
			pagination={false}
			columns={normalizedColumns}
			dataSource={tableData}
			rowSelection={rowSelection}
			expandable={expandable}
			onChange={mergedOnChange}
			onRow={mergedOnRow}
			rowClassName={mergedRowClassName}
			locale={mergedLocale}
		/>
	);

	const paginationPageSizeOptions = pagination === false ? undefined : pagination?.pageSizeOptions;
	const paginationShowQuickJumper = pagination === false ? undefined : pagination?.showQuickJumper;
	const paginationShowSizeChanger = pagination === false ? undefined : pagination?.showSizeChanger;

	const tableContentNode = (
		<>
			<div className="mt-4 w-full">
				<Spin spinning={loading} tip="Loading...">
					{bodyNode}
				</Spin>
			</div>
			{isPaginationEnabled ? (
				<div className="mt-4 flex items-center justify-between gap-3">
					<div className={styles.paginationTotal}>{paginationTotalNode}</div>
					<Pagination
						className={styles.pagination}
						current={page}
						pageSize={pageSize}
						total={tableTotal}
						showSizeChanger={paginationShowSizeChanger ?? true}
						showQuickJumper={paginationShowQuickJumper ?? true}
						pageSizeOptions={paginationPageSizeOptions}
						showTotal={undefined}
						itemRender={(_pageNumber, type, element) => {
							if (type === "prev") {
								return (
									<span className={styles.paginationNav}>
										<Icon icon="ep:arrow-left" />
										Previous
									</span>
								);
							}
							if (type === "next") {
								return (
									<span className={styles.paginationNav}>
										Next
										<Icon icon="ep:arrow-right" />
									</span>
								);
							}
							return element;
						}}
						onChange={handlePageChange}
					/>
				</div>
			) : null}
			{slots?.footer?.()}
		</>
	);

	const tableNode = (
		<div className="rounded-xl border bg-card px-6 py-5">
			{toolbarNode}
			{tableContentNode}
		</div>
	);

	return (
		<div ref={containerRef} className={cn("flex flex-col gap-4", containerClassName)} style={containerStyle}>
			{slots?.header?.()}
			{searchNode}
			{tableNode}
		</div>
	);
}

export type { TableConfig, ContentSlotContext, TableAction };
