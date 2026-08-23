# ConfigTable 使用文档

`ConfigTable` 是基于 Ant Design Table 的通用表格组件，支持搜索区、工具栏、批量操作、行内操作、分页与自定义内容渲染。

## 快速开始

- 默认表格：配置 `columns` 和 `dataSource` 即可渲染标准表格。
- 自定义内容：仅配置 `render` 即可替换表格内容区，保留搜索、工具栏、分页等能力。

## 组件属性（ConfigTable）

### actionRef

提供列表刷新能力（适用于新建/编辑成功后刷新列表）：

- `actionRef?: React.MutableRefObject<TableAction | null>`
- `actionRef.current?.reload({ resetPage?: boolean })`

## 刷新列表的两种方式

### 方式一：actionRef（推荐）

适用于新建/编辑成功后主动刷新列表，可选择是否回到第一页。

```tsx
import { useRef } from "react";
import ConfigTable from "@/components/table";
import type { TableAction, TableConfig } from "@/components/table";

const actionRef = useRef<TableAction | null>(null);

const config: TableConfig<Record<string, any>> = {
  dataSource: { api: async () => ({ list: [], total: 0 }) },
  columns: [{ title: "名称", dataIndex: "name" }],
};

const handleSubmitSuccess = () => {
  actionRef.current?.reload({ resetPage: true });
};

export default () => <ConfigTable config={config} actionRef={actionRef} />;
```

### 方式二：refreshKey + defaultParams

通过改变 `defaultParams` 触发列表请求刷新。

```tsx
import { useState } from "react";
import ConfigTable from "@/components/table";
import type { TableConfig } from "@/components/table";

const [refreshKey, setRefreshKey] = useState(0);

const config: TableConfig<Record<string, any>> = {
  dataSource: {
    api: async () => ({ list: [], total: 0 }),
    defaultParams: { refreshKey },
  },
  columns: [{ title: "名称", dataIndex: "name" }],
};

const handleSubmitSuccess = () => {
  setRefreshKey((k) => k + 1);
};

export default () => <ConfigTable config={config} />;
```

## 核心配置（TableConfig）

### dataSource

数据来源配置，支持静态数据与服务端请求：

- `api?: (params) => Promise<unknown>`：请求函数（服务端模式）。
- `data?: T[]`：静态数据（客户端模式）。
- `transform?: (data) => { list: T[]; total: number } | T[]`：响应数据转换。
- `defaultParams?: Record<string, unknown>`：默认请求参数。

### columns

表格列配置（自定义内容渲染时可省略）：

- `title`: 列标题
- `dataIndex`: 字段名或路径数组
- `key`: 列唯一标识
- `width`: 列宽
- `align`: 对齐方式
- `fixed`: 固定列
- `selection`: 是否为多选列（仅控制是否展示多选）
- `render`: 单元格自定义渲染
- `tooltip`: 单元格悬浮提示
- `format`: 内置格式化（`date`/`currency`/`percentage`/`status`）
- `statusMap`: 状态映射
- `sorter`/`sortable`/`sorterFn`/`sortOrder`: 排序相关
- `filterable`: 是否启用筛选
- `hideInTable`: 是否在表格隐藏
- `hideInSearch`: 是否在搜索隐藏

### search

搜索区配置：

- `layout`: `horizontal | vertical | inline`
- `colSpan`: 搜索项列数
- `fields`: 搜索字段数组
- `showAdvanced`: 是否开启展开/收起
- `searchButtonText` / `resetButtonText`: 按钮文案
- `gap`: 搜索区间距
- `cacheKey`: 缓存 key（sessionStorage）
- `grid`: 栅格化布局配置（`columns`/`md`/`lg`/`xl`/`gap`）
- `render`: 自定义搜索区渲染

### toolbar

右上角工具栏配置：

- `refresh`: 刷新按钮
- `density`: 密度切换
- `fullscreen`: 全屏按钮
- `columnSetting`: 列设置
- `export`: 导出（`enabled`/`formats`/`fileName`）
- `customActions`: 自定义按钮数组
- `align`: 对齐方式（`left | right`）
- `render`: 自定义工具栏渲染

### rowActions

行内操作按钮：

- `text`: 按钮文字
- `icon`: 图标
- `action`: 操作类型
- `onClick`: 点击事件
- `confirm`: 二次确认
- `disabled` / `visible`: 控制状态

### batchActions

批量操作按钮：

- `text`: 按钮文字
- `action`: 操作类型
- `onClick`: 处理函数
- `confirm`: 二次确认
- `requireSelection`: 是否需要勾选
- `disabled`: 是否禁用

### pagination

分页配置（传 `false` 关闭）：

- `showSizeChanger` / `showQuickJumper`
- `pageSizeOptions`
- `showTotal`

### paginationMode / sortMode

模式选择：

- `paginationMode`: `auto | client | server`
- `sortMode`: `auto | client | server`

### expandable

展开行配置：

- `expandedRowRender`
- `rowExpandable`

### rowSelection

多选配置（`true`/`false`/`TableRowSelection`）。

### events

事件回调：

- `onRowClick`
- `onSelectionChange`
- `onLoadSuccess`
- `onLoadError`

### slots

插槽能力：

- `header`
- `toolbarLeft`
- `toolbarRight`
- `content`: 自定义内容组件（替代默认 Table）
- `footer`
- `empty`
- `loading`

### render

自定义内容渲染函数（替代默认 Table），优先级高于 `slots.content`。

### containerClassName / containerStyle

外层容器样式。

## 示例一：默认 Table

```tsx
import ConfigTable from "@/components/table";
import type { TableConfig } from "@/components/table";

type UserRecord = {
  id: string;
  name: string;
  role: string;
  createdAt: string;
};

const config: TableConfig<UserRecord> = {
  dataSource: { data: [] },
  columns: [
    { title: "ID", dataIndex: "id", width: 120 },
    { title: "姓名", dataIndex: "name", width: 160 },
    { title: "角色", dataIndex: "role", width: 120 },
    { title: "创建时间", dataIndex: "createdAt", width: 160, format: "date" },
  ],
  search: {
    layout: "horizontal",
    fields: [
      { name: "name", label: "姓名", type: "input" },
      {
        name: "role",
        label: "角色",
        type: "select",
        options: [
          { label: "管理员", value: "admin" },
          { label: "成员", value: "member" },
        ],
      },
    ],
  },
  toolbar: {
    align: "right",
    refresh: true,
    density: true,
    columnSetting: true,
  },
  pagination: { showTotal: (total) => `共 ${total} 条` },
};

export default () => <ConfigTable config={config} />;
```

## 示例三：新建/编辑后刷新列表

```tsx
import { useRef } from "react";
import ConfigTable from "@/components/table";
import type { TableAction, TableConfig } from "@/components/table";

const actionRef = useRef<TableAction | null>(null);

const config: TableConfig<Record<string, any>> = {
  dataSource: { api: async () => ({ list: [], total: 0 }) },
  columns: [{ title: "名称", dataIndex: "name" }],
};

const handleSubmitSuccess = () => {
  actionRef.current?.reload({ resetPage: true });
};

export default () => (
  <>
    <ConfigTable config={config} actionRef={actionRef} />
    {/* 在新建/编辑成功后调用 handleSubmitSuccess */}
  </>
);
```

## 示例二：自定义内容渲染

```tsx
import { Card, Empty } from "antd";
import ConfigTable from "@/components/table";
import type { ContentSlotContext, TableConfig } from "@/components/table";

type BrandRecord = {
  id: string;
  name: string;
  category: string;
};

const BrandCardList = ({ data }: ContentSlotContext<BrandRecord>) => {
  if (!data.length) return <Empty description="暂无品牌数据" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((brand) => (
        <Card key={brand.id}>{brand.name}</Card>
      ))}
    </div>
  );
};

const config: TableConfig<BrandRecord> = {
  dataSource: { data: [] },
  search: {
    layout: "horizontal",
    fields: [{ name: "name", label: "品牌名称", type: "input" }],
  },
  toolbar: {
    refresh: true,
    density: true,
  },
  pagination: { showTotal: (total) => `共 ${total} 条` },
  render: (ctx) => <BrandCardList {...ctx} />,
};

export default () => <ConfigTable config={config} />;
```
