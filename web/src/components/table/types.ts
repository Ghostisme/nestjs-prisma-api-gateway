import type { ButtonProps } from "antd/es/button";
import type { FormInstance, Rule } from "antd/es/form";
import type { ColumnType, TableProps } from "antd/es/table";
import type { TablePaginationConfig, TableRowSelection } from "antd/es/table/interface";
import type { ComponentType, CSSProperties, Key, ReactNode } from "react";

export type TableDataResponse<T> = {
	list: T[];
	total: number;
};

export type TableDataSource<T> = {
	api?: (params: Record<string, unknown>) => Promise<unknown>;
	data?: T[];
	transform?: (data: unknown) => TableDataResponse<T> | T[];
	defaultParams?: Record<string, unknown>;
};

export type TableColumn<T> = {
	title: string;
	dataIndex: string | (string | number)[];
	key?: string;
	width?: number | string;
	align?: "left" | "center" | "right";
	fixed?: "left" | "right";
	/** 标记为多选列（仅用来控制是否展示多选） */
	selection?: boolean;
	render?: (...args: any[]) => ReactNode;
	tooltip?: boolean | ((...args: any[]) => ReactNode);
	format?: "date" | "currency" | "percentage" | "status";
	statusMap?: Record<string | number, ReactNode>;
	sorter?: ColumnType<T>["sorter"];
	sortable?: boolean;
	sorterFn?: (a: T, b: T) => number;
	sortOrder?: "ascend" | "descend" | null;
	ellipsis?: ColumnType<T>["ellipsis"];
	filterable?: boolean;
	hideInTable?: boolean;
	hideInSearch?: boolean;
};

export type SearchFieldType =
	| "input"
	| "select"
	| "multiSelect"
	| "brandSelect"
	| "brandTreeSelect"
	| "selectMultiQuery"
	| "date"
	| "daterange"
	| "number"
	| "numberRange"
	| "cascader"
	| "treeSelect"
	| "multiTreeSelect"
	| "switch"
	| "checkbox";

export type SearchBreakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";
export type SearchLayout = "horizontal" | "vertical" | "inline";
export type SearchActionsPlacement = "bottom" | "right";
export type SearchActionsDirection = "horizontal" | "vertical";
export type ResponsiveSearchValue<T> = T | Partial<Record<SearchBreakpoint, T>>;

export type SearchResponsiveConfig = {
	columns?: number;
	layout?: SearchLayout;
	gap?: number;
	actionsPlacement?: SearchActionsPlacement;
	actionsDirection?: SearchActionsDirection;
};

export type TreeSelectOption = {
	title: string;
	value: number | string;
	key?: number | string;
	children?: TreeSelectOption[];
};

export type SearchFieldConfig = {
	name: string;
	label: string;
	type: SearchFieldType;
	placeholder?: string;
	options?: Array<{ label: string; value: string | number | null }>;
	/** treeSelect 专用：树形数据 */
	treeData?: TreeSelectOption[];
	defaultValue?: unknown;
	rules?: Rule[];
	props?: Record<string, unknown>;
	/** grid 布局下的栅格占用（span） */
	gridSpan?: number;
	/** 响应式栅格占用（优先于 gridSpan） */
	span?: ResponsiveSearchValue<number>;
	/** 搜索项容器样式 */
	itemStyle?: CSSProperties;
	/** 搜索项容器类名 */
	itemClassName?: string;
	/** 仅 daterange：提交时拆成两个请求字段 */
	submitAs?: { start: string; end: string };
	/** 字段值变更后自动触发搜索 */
	submitOnChange?: boolean;
};

export type SearchConfig = {
	layout?: SearchLayout;
	colSpan?: number;
	fields?: SearchFieldConfig[];
	showAdvanced?: boolean;
	// 按钮布局模式
	isButtonHorizontal?: boolean;
	/** showAdvanced=true 时，收起状态默认展示数量（默认 6） */
	initialVisibleCount?: number;
	searchButtonText?: string;
	resetButtonText?: string;
	/** 点击重置时调用，可用于同步重置页内状态（如排序） */
	onReset?: () => void;
	/** 搜索条件每行/每列间隙（px），默认 16 */
	gap?: number;
	/** 启用查询条件缓存（sessionStorage） */
	cacheKey?: string;
	/** 响应式布局配置（优先于旧版 layout/grid/isButtonHorizontal/gap） */
	responsive?: Partial<Record<SearchBreakpoint, SearchResponsiveConfig>>;
	/** 栅格化配置（优先于 flex） */
	grid?: {
		columns?: number;
		md?: number;
		lg?: number;
		xl?: number;
		xxl?: number;
		xxxl?: number;
		gap?: number;
	};
	/** 搜索表单值变更时触发 */
	onValuesChange?: (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => void;
	/** 自定义渲染 */
	render?: (ctx: { fields: SearchFieldConfig[]; form: FormInstance }) => ReactNode;
};

export type ToolbarAction<T> = {
	text: string;
	icon?: ReactNode;
	onClick?: (selectedRows: T[]) => void;
	/** 自定义渲染（如下拉面板）；存在时优先于 Button，onClick 可省略 */
	render?: (selectedRows: T[]) => ReactNode;
	type?: ButtonProps["type"];
	danger?: ButtonProps["danger"];
	ghost?: ButtonProps["ghost"];
	loading?: ButtonProps["loading"];
	size?: ButtonProps["size"];
	shape?: ButtonProps["shape"];
	block?: ButtonProps["block"];
	iconPosition?: ButtonProps["iconPosition"];
	disabled?: boolean | ((selectedRows: T[]) => boolean);
	requireSelection?: boolean;
};

export type ToolbarConfig<T> = {
	refresh?: boolean;
	density?: boolean;
	fullscreen?: boolean;
	columnSetting?: boolean;
	export?: {
		enabled: boolean;
		formats?: Array<"excel" | "csv">;
		fileName?: string;
	};
	customActions?: Array<ToolbarAction<T>>;
	/** 操作按钮对齐方式 */
	align?: "left" | "right";
	/** 自定义渲染 */
	render?: (ctx: { selectedRows: T[] }) => ReactNode;
};

export type RowAction<T> = {
	text: string;
	icon?: ReactNode;
	action: "view" | "edit" | "delete" | string;
	type?: "danger";
	onClick?: (record: T) => void | Promise<void>;
	confirm?: {
		title: string;
		content: string;
	};
	disabled?: boolean | ((record: T) => boolean);
	visible?: boolean | ((record: T) => boolean);
};

export type BatchAction<T> = {
	text: string;
	action: "delete" | "export" | "updateStatus" | string;
	onClick: (selectedRows: T[], onSuccess?: () => void) => void;
	confirm?: {
		title: string;
		content: string;
	};
	requireSelection?: boolean;
	disabled?: boolean;
};

export type PaginationConfig = {} & TablePaginationConfig;

export type ExpandableConfig<T> = {
	expandedRowRender?: (record: T) => ReactNode;
	rowExpandable?: (record: T) => boolean;
};

export type TableEvents<T> = {
	onRowClick?: (record: T, index: number) => void;
	onSelectionChange?: (selectedRows: T[]) => void;
	onLoadSuccess?: (data: T[]) => void;
	onLoadError?: (error: Error) => void;
};

export interface TableAction {
	reload: (options?: { resetPage?: boolean }) => void;
	getSearchValues: () => Record<string, unknown>;
}

export type ContentSlotContext<T> = {
	data: T[];
	loading: boolean;
	total: number;
	page: number;
	pageSize: number;
	selectedRowKeys: Key[];
	selectedRows: T[];
	onSelectionChange?: (keys: Key[], rows: T[]) => void;
	isPaginationEnabled: boolean;
	onPageChange: (page: number, pageSize: number) => void;
	onRefresh: () => void;
	paginationTotalNode: ReactNode;
};

export type TableSlots<T> = {
	header?: () => ReactNode;
	toolbarLeft?: () => ReactNode;
	toolbarRight?: () => ReactNode;
	/** 自定义内容区：传入时用自定义组件渲染列表等任意内容，替代默认 Table；仍可使用搜索、工具栏、分页 */
	content?: ComponentType<ContentSlotContext<T>>;
	footer?: () => ReactNode;
	empty?: () => ReactNode;
	loading?: () => ReactNode;
};

export type PaginationMode = "auto" | "client" | "server";
export type SortMode = "auto" | "client" | "server";

export type TableConfig<T = any> = Omit<
	TableProps<T>,
	"columns" | "dataSource" | "pagination" | "rowSelection" | "expandable"
> & {
	dataSource?: TableDataSource<T>;
	/** 渲染自定义内容时可省略 columns */
	columns?: TableColumn<T>[];
	search?: SearchConfig;
	toolbar?: ToolbarConfig<T>;
	rowActions?: RowAction<T>[];
	batchActions?: BatchAction<T>[];
	pagination?: PaginationConfig | false;
	paginationMode?: PaginationMode;
	/** 排序模式（默认前端） */
	sortMode?: SortMode;
	expandable?: ExpandableConfig<T>;
	zebra?: boolean;
	rowSelection?: TableRowSelection<T> | boolean;
	events?: TableEvents<T>;
	slots?: TableSlots<T>;
	containerClassName?: string;
	containerStyle?: CSSProperties;
	/** 自定义内容区渲染（替代默认 Table） */
	render?: (ctx: ContentSlotContext<T>) => ReactNode;
};
