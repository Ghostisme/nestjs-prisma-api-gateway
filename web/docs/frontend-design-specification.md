# Lumax Agent 前端设计方案

> **文档版本**：v1.0.0
> **更新日期**：2026-03-02
> **项目名称**：Lumax Agent（web）
> **适用范围**：前端架构设计、版本迭代规划、项目制交付

---

## 文档修订记录

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|----------|
| v1.0.0 | 2026-03-02 | — | 初始版本，包含架构设计、模块划分、迭代规划 |

---

## 一、项目概述

### 1.1 项目背景

星动智能体是一套面向品牌营销管理的 B 端 SaaS 平台，核心业务涵盖品牌库管理、经销商管理、素材中心、数据 BI、团队管理和权限控制等模块。项目基于 React 19 生态构建，采用 Vite 作为构建工具，前后端分离架构。

### 1.2 项目定位

| 维度 | 说明 |
|------|------|
| 产品类型 | B 端管理后台 |
| 目标用户 | 品牌运营人员、PMO、优化师、数据专员 |
| 核心价值 | 品牌全链路管理 + 数据洞察 |
| 部署方式 | K8s 容器化部署，网关统一入口 |

### 1.3 团队概况

| 成员 | 提交量 | 角色 |
|------|--------|------|
| zhaoshanshan | 80 | 主要开发者 |
| buhuish1 | 46 | 核心开发者 |
| rich | 24 | 开发者 |
| zss | 7 | 开发者 |
| 李智 | 2 | 开发者 |
| ～Ｗｙｄ丶 | 2 | 开发者 |

---

## 二、技术架构

### 2.1 技术栈总览

```
┌─────────────────────────────────────────────────────────┐
│                      应用层                              │
│  React 19 · TypeScript 5.6 · React Router 7             │
├─────────────────────────────────────────────────────────┤
│                      UI 层                               │
│  Ant Design 6 · shadcn/ui · Tailwind CSS 4              │
│  Vanilla-extract · Framer Motion · Iconify              │
├─────────────────────────────────────────────────────────┤
│                    数据层                                 │
│  Zustand (全局状态) · TanStack Query (服务端状态)         │
│  React Hook Form + Zod (表单)                           │
├─────────────────────────────────────────────────────────┤
│                    网络层                                 │
│  Axios (HTTP Client) · MSW (Mock)                       │
├─────────────────────────────────────────────────────────┤
│                   构建与工程化                            │
│  Vite 6 · Biome · Lefthook · pnpm                       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心依赖版本

| 类别 | 库 | 版本 | 用途 |
|------|-----|------|------|
| 框架 | react | ^19.1.0 | UI 框架 |
| 框架 | react-dom | ^19.1.0 | DOM 渲染 |
| 路由 | react-router | ^7.0.2 | 客户端路由 |
| UI | antd | ^6.2.2 | 企业级 UI 组件库 |
| UI | radix-ui | ^1.4.2 | 无样式原子组件（shadcn/ui 底层） |
| 样式 | tailwindcss | ^4.1.3 | 原子化 CSS |
| 样式 | @vanilla-extract/css | ^1.17.0 | 零运行时 CSS-in-TS |
| 状态 | zustand | ^4.5.5 | 轻量全局状态 |
| 数据 | @tanstack/react-query | ^5.60.2 | 服务端状态管理 |
| 表单 | react-hook-form | ^7.56.1 | 高性能表单 |
| 校验 | zod | ^3.24.3 | 类型安全的 Schema 校验 |
| 网络 | axios | ^1.7.7 | HTTP 客户端 |
| 图表 | apexcharts | ^4.5.0 | 数据可视化 |
| 动画 | motion | ^12.9.0 | 声明式动画 |
| 构建 | vite | ^6.2.0 | 开发服务器与构建 |
| 规范 | @biomejs/biome | 2.1.3 | 格式化 + Lint |
| 包管理 | pnpm | 10.8.0 | 依赖管理 |

### 2.3 Node 环境要求

```
node: 20.*
packageManager: pnpm@10.8.0
```

---

## 三、工程架构

### 3.1 目录结构

```
xdwx-frontend/
├── public/                          # 静态资源
│   ├── favicon.ico
│   ├── logo.png
│   └── mockServiceWorker.js         # MSW Service Worker
├── src/                             # 核心源码
│   ├── _mock/                       # Mock 数据与 Handler
│   │   ├── handlers/                # 各模块 Mock Handler
│   │   ├── assets.ts                # 静态 Mock 数据
│   │   ├── index.ts                 # MSW Worker 入口
│   │   └── utils.ts                 # Mock 工具函数
│   ├── api/                         # API 请求层
│   │   ├── apiClient.ts             # Axios 封装（统一拦截器）
│   │   ├── upload.ts                # OSS 上传服务
│   │   ├── uploadContentType.ts     # MIME 类型映射
│   │   ├── brand/                   # 品牌相关 API
│   │   ├── login/                   # 登录认证 API
│   │   ├── app/                     # 应用消息 API
│   │   └── services/                # 通用业务服务
│   ├── assets/                      # 静态资源
│   │   ├── icons/                   # SVG 图标
│   │   ├── images/                  # 图片资源
│   │   └── svg/                     # SVG 背景
│   ├── components/                  # 全局业务组件
│   │   ├── animate/                 # 动画组件（Motion 封装）
│   │   ├── auth/                    # 权限守卫组件
│   │   ├── chart/                   # 图表组件（ApexCharts 封装）
│   │   ├── icon/                    # 图标组件（Iconify 封装）
│   │   ├── loading/                 # 加载状态组件
│   │   ├── nav/                     # 导航组件（垂直/水平/迷你）
│   │   ├── table/                   # 表格组件
│   │   ├── upload/                  # 上传组件
│   │   ├── editor/                  # 富文本编辑器
│   │   ├── toast/                   # 消息提示
│   │   └── logo/                    # Logo 组件
│   ├── hooks/                       # 全局自定义 Hooks
│   ├── layouts/                     # 页面布局
│   │   ├── dashboard/               # 后台主布局
│   │   ├── simple/                  # 简单布局（错误页）
│   │   └── components/              # 布局公共组件
│   ├── pages/                       # 页面组件（按业务域划分）
│   │   ├── brand/                   # 品牌管理
│   │   ├── data-bi/                 # 数据 BI
│   │   ├── materialCenter/          # 素材中心
│   │   ├── sys/                     # 系统（登录/错误页）
│   │   ├── sys-account-management/  # 系统账号管理
│   │   ├── team-management/         # 团队管理
│   │   └── rbac/                    # 权限常量
│   ├── routes/                      # 路由配置
│   │   ├── sections/                # 路由定义（auth/dashboard/main）
│   │   ├── hooks/                   # 路由 Hooks
│   │   └── components/              # 路由组件（守卫/错误边界）
│   ├── store/                       # 全局状态（Zustand）
│   ├── theme/                       # 主题系统
│   │   ├── adapter/                 # UI 库主题适配器
│   │   ├── hooks/                   # 主题 Hooks
│   │   └── tokens/                  # 设计令牌
│   ├── types/                       # 全局类型定义
│   ├── ui/                          # 基础 UI 组件（shadcn/ui）
│   ├── utils/                       # 工具函数
│   ├── App.tsx                      # 根组件
│   ├── main.tsx                     # 入口文件
│   ├── global-config.ts             # 全局配置
│   └── global.css                   # 全局样式
├── .env.development                 # 开发环境变量
├── .env.production                  # 生产环境变量
├── biome.json                       # Biome 配置
├── tailwind.config.ts               # Tailwind 配置
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 配置
├── lefthook.yml                     # Git Hooks 配置
└── package.json                     # 依赖与脚本
```

### 3.2 路径别名

| 别名 | 映射 | 用途 |
|------|------|------|
| `@/*` | `src/*` | 源码目录快捷引用 |
| `#/*` | `src/types/*` | 类型定义快捷引用 |

### 3.3 环境配置

| 环境 | 配置文件 | API 地址 | 说明 |
|------|----------|----------|------|
| 开发 | `.env.development` | `http://localhost:9999/api` | 本地开发，Vite 代理转发 |
| 测试 | `.env.test` | — | 测试环境 |
| 预发 | `.env.staging` | — | 预发环境 |
| 生产 | `.env.production` | `https://api.example.com/api` | K8s 网关入口 |

---

## 四、应用架构设计

### 4.1 应用启动流程

```
main.tsx
  │
  ├── 1. 加载全局样式（global.css、theme.css）
  ├── 2. 注册本地图标（registerLocalIcons）
  ├── 3. 创建 BrowserRouter（routesSection + ErrorBoundary）
  │
  └── App.tsx
       ├── HelmetProvider          # HTML Head 管理
       ├── QueryClientProvider     # TanStack Query 数据层
       └── ThemeProvider           # 主题系统
            ├── AntdAdapter        # Ant Design 主题适配
            ├── Toast              # 全局消息
            ├── RouteLoadingProgress # 路由切换进度条
            └── MotionLazy         # 动画延迟加载
                 └── <Outlet />    # 路由出口
```

### 4.2 路由架构

#### 路由模式

项目支持两种路由模式，通过 `GLOBAL_CONFIG.routerMode` 切换：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `frontend` | 前端静态路由定义 | 标准 SaaS 版本 |
| `backend` | 后端动态菜单驱动路由 | 项目制定制交付 |

#### 路由层级

```
/                              → 根路由
├── /auth/login                → 登录页（SimpleLayout）
├── /403, /404, /500           → 错误页（SimpleLayout）
└── /* (需登录)                → DashboardLayout
     ├── /material-center      → 素材中心
     │    ├── /unmark          → 未打标素材
     │    ├── /mark            → 已打标素材
     │    ├── /tag             → 标签管理
     │    └── /brand           → 品牌管理
     ├── /sys-account-management → 系统账号管理
     │    ├── /user-management   → 用户管理
     │    ├── /role-management   → 角色管理
     │    └── /department-management → 部门管理
     └── /error                → 错误页
          ├── /403
          ├── /404
          └── /500
```

#### 路由守卫

```
LoginAuthGuard
  │
  └── 检查 userToken 是否存在
       ├── 存在 → 放行，渲染子路由
       └── 不存在 → 重定向到 /auth/login

AuthGuard（Main 组件内）
  │
  └── 检查当前路由权限
       ├── 有权限 → 渲染页面
       └── 无权限 → 渲染 PermissionFallback
```

### 4.3 布局系统

| 布局 | 组件 | 适用场景 |
|------|------|----------|
| DashboardLayout | `layouts/dashboard/` | 后台管理主布局 |
| SimpleLayout | `layouts/simple/` | 登录页、错误页 |

**DashboardLayout 特性**：

- 支持三种导航模式：垂直侧边栏 / 水平顶栏 / 迷你折叠
- 响应式适配：移动端自动切换为抽屉导航
- 多标签页（Multi-Tab）：支持拖拽排序、右键菜单操作
- 面包屑导航
- 全局搜索、消息通知、账号下拉

---

## 五、核心模块设计

### 5.1 API 层设计

#### 架构分层

```
页面组件
  │
  ├── TanStack Query (useQuery / useMutation)
  │
  ├── API 模块（src/api/brand/library.ts 等）
  │
  └── ApiClient（src/api/apiClient.ts）
       │
       └── Axios 实例
            ├── 请求拦截器
            │    ├── Bearer Token 注入
            │    ├── Business-Code 请求头
            │    └── FormData 自动处理
            └── 响应拦截器
                 ├── 统一 Result 解包
                 ├── 401/424 Token 失效处理
                 └── 错误 Toast 提示
```

#### API 模块划分

| 模块 | 路径 | 职责 |
|------|------|------|
| 认证 | `api/login/` | 登录、验证码、Token 管理 |
| 品牌库 | `api/brand/library.ts` | 品牌 CRUD、大区管理、操作日志 |
| 经销商 | `api/brand/dealer.ts` | 门店管理、状态变更 |
| 车型 | `api/brand/model.ts` | 品牌车型管理 |
| 上传 | `api/upload.ts` | OSS 预签名上传、文件校验 |
| 团队 | `api/services/teamService.ts` | 专员/PMO 管理 |
| 用户 | `api/services/userManagementService.ts` | 用户 CRUD |
| 角色 | `api/services/roleManagementService.ts` | 角色 CRUD、菜单分配 |
| 部门 | `api/services/deptManagementService.ts` | 部门管理 |
| BI | `api/services/biService.ts` | 数据统计汇总 |
| 优化师 | `api/services/optimizerService.ts` | 优化师分配管理 |

#### 统一响应格式

```typescript
interface Result<T = any> {
  code: number;
  msg: string;
  data: T;
}
```

### 5.2 状态管理设计

#### 状态分类

| 类型 | 管理方案 | 存储 | 场景 |
|------|----------|------|------|
| 全局状态 | Zustand | localStorage/sessionStorage | 用户信息、主题设置 |
| 服务端状态 | TanStack Query | 内存缓存 | API 数据、列表、详情 |
| 表单状态 | React Hook Form | 组件内 | 表单输入、校验 |
| 组件状态 | useState/useReducer | 组件内 | UI 交互状态 |

#### Zustand Store 设计

| Store | 文件 | 持久化 | 状态内容 |
|-------|------|--------|----------|
| userStore | `store/userStore.ts` | localStorage | userInfo、userToken（accessToken/refreshToken/wxAccessToken） |
| settingStore | `store/settingStore.ts` | localStorage | 主题模式、色板、布局、字体、多标签等 |
| dealerStoreDetailStore | `store/dealerStoreDetailStore.ts` | sessionStorage | 经销商门店详情上下文 |

### 5.3 主题系统设计

#### 设计令牌体系

```
tokens/
├── color.ts          # 色板（7 种预设 + 亮/暗变体）
├── typography.ts     # 字体族、字号（12px~64px）、字重、行高
├── base.ts           # 间距、圆角、透明度、层级
├── breakpoints.ts    # 断点（xs~2xl）
└── shadow.ts         # 阴影（亮/暗模式各 25 级）
```

#### 主题切换能力

| 维度 | 选项 | 说明 |
|------|------|------|
| 模式 | light / dark | 亮色/暗色模式 |
| 色板 | default / cyan / purple / blue / orange / red / pink | 7 种预设品牌色 |
| 布局 | vertical / horizontal / mini | 3 种导航布局 |
| 字体 | Inter / Open Sans 等 | 可切换字体族 |
| 方向 | ltr / rtl | 文字方向（国际化） |

#### 主题适配器模式

```
ThemeProvider
  │
  ├── 读取 settingStore 配置
  ├── 计算主题 Token
  ├── 同步 HTML data 属性
  │    ├── data-theme-mode="light|dark"
  │    └── data-color-palette="default|cyan|..."
  └── 渲染 UI 库适配器
       └── AntdAdapter
            ├── ConfigProvider (Ant Design 主题)
            ├── algorithm (亮色/暗色算法)
            └── locale (zh_CN)
```

### 5.4 组件体系

#### 三层组件架构

```
┌────────────────────────────────────────────┐
│  业务组件（src/pages/*/components/）         │
│  品牌卡片、创建表单、详情弹窗等               │
├────────────────────────────────────────────┤
│  全局业务组件（src/components/）              │
│  导航、表格、上传、图表、权限守卫等            │
├────────────────────────────────────────────┤
│  基础 UI 组件（src/ui/）                     │
│  Button、Dialog、Form、Input 等 34 个组件    │
│  基于 shadcn/ui (Radix UI + Tailwind)       │
└────────────────────────────────────────────┘
```

#### 基础 UI 组件清单（shadcn/ui）

Avatar、Badge、Breadcrumb、Button、Calendar、Card、Checkbox、Collapsible、Command、Dialog、Drawer、Dropdown Menu、Form、Hover Card、Input、Input OTP、Label、Popover、Progress、Radio Group、Scroll Area、Select、Separator、Sheet、Sidebar、Skeleton、Slider、Switch、Tabs、Textarea、Toggle、Toggle Group、Tooltip、Typography

#### 全局业务组件

| 组件类别 | 路径 | 功能 |
|----------|------|------|
| 动画 | `components/animate/` | Motion 封装，含 12 种动画变体 |
| 权限 | `components/auth/` | AuthGuard 权限守卫 |
| 图表 | `components/chart/` | ApexCharts 封装 |
| 图标 | `components/icon/` | Iconify 统一接口 + 本地 SVG 注册 |
| 加载 | `components/loading/` | 路由进度条、行加载、全屏加载 |
| 导航 | `components/nav/` | 垂直/水平/迷你三种导航 |
| 表格 | `components/table/` | Ant Design Table 封装 |
| 上传 | `components/upload/` | OSS 上传（头像/文件/拖拽） |
| 编辑器 | `components/editor/` | 富文本编辑器（React Quill） |

---

## 六、构建与工程化

### 6.1 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（端口 3001） |
| `pnpm dev:test` | 以测试环境启动 |
| `pnpm dev:staging` | 以预发环境启动 |
| `pnpm dev:prod` | 以生产环境启动 |
| `pnpm build` | 生产构建 |
| `pnpm build:dev` | 开发环境构建 |
| `pnpm preview` | 预览构建产物 |

### 6.2 代理配置

| 路径 | 目标 | 说明 |
|------|------|------|
| `/api/material` | `VITE_API_WX_URL` | 素材相关接口转发 |
| `/api/system` | `VITE_API_WX_URL` | 系统相关接口转发 |
| `/api` | `VITE_API_BASE_URL` | 默认 API 转发 |

### 6.3 构建优化

#### 代码分割策略

| Chunk | 包含模块 | 说明 |
|-------|----------|------|
| `vendor-core` | react、react-dom、react-router | 核心框架 |
| `vendor-ui` | antd、@ant-design/cssinjs、styled-components | UI 组件库 |
| `vendor-utils` | axios、dayjs、zustand、@iconify/react | 工具库 |
| `vendor-charts` | apexcharts、react-apexcharts | 图表库 |

#### 构建配置要点

- 目标：`esnext`
- 压缩：`esbuild`（生产移除 console/debugger）
- CSS 代码分割：启用
- Source Map：仅非生产环境
- Chunk 大小警告阈值：1500KB

### 6.4 代码质量

| 工具 | 配置 | 规则 |
|------|------|------|
| Biome | `biome.json` | 格式化（Tab 缩进、120 字符行宽）+ Lint |
| Lefthook | `lefthook.yml` | Git commit 前自动检查 |
| CommitLint | `@commitlint/config-conventional` | 约定式提交信息 |
| TypeScript | `tsconfig.json` | 严格模式（strict、strictNullChecks、noImplicitAny） |

---

## 七、Git 分支与版本管理

### 7.1 分支策略

| 分支 | 用途 | 保护级别 |
|------|------|----------|
| `master` | 主分支，生产代码 | 受保护，需 PR 合并 |
| `test` | 测试环境分支 | 受保护 |
| `dev-zh` | 开发集成分支 | — |
| `feature/*` | 功能开发分支 | — |

#### 当前功能分支

| 分支 | 说明 |
|------|------|
| `feature/rich` | 当前活跃开发分支 |
| `feature/xdbdt_zss` | 星动-品牌特性开发 |
| `feature/xdwx_zss` | 星动-万象特性开发 |
| `feature/项目迁移` | 项目迁移分支 |

### 7.2 推荐版本迭代流程

```
master (生产)
  │
  ├── release/v1.1.0 ← 从 master 拉取
  │     │
  │     ├── feature/v1.1.0-brand-optimization
  │     ├── feature/v1.1.0-bi-dashboard
  │     └── feature/v1.1.0-permission-refactor
  │           │
  │           └── 功能开发完成 → PR 合并至 release/v1.1.0
  │
  ├── release/v1.1.0 → 测试通过 → 合并至 master，打 Tag v1.1.0
  │
  └── hotfix/v1.0.1 ← 紧急修复从 master 拉取，修复后合并回 master + 开发分支
```

### 7.3 版本号规范

采用 **语义化版本**（SemVer）：`MAJOR.MINOR.PATCH`

| 类型 | 递增规则 | 示例 |
|------|----------|------|
| MAJOR | 不兼容的 API 变更或架构重构 | 1.0.0 → 2.0.0 |
| MINOR | 向下兼容的新功能 | 1.0.0 → 1.1.0 |
| PATCH | 向下兼容的问题修复 | 1.0.0 → 1.0.1 |

### 7.4 提交信息规范

```
<type>(<scope>): <subject>

type:
  feat     新功能
  fix      修复
  docs     文档
  style    格式
  refactor 重构
  perf     性能优化
  test     测试
  chore    构建/工具变更
```

---

## 八、业务模块规划

### 8.1 模块全景图

```
星动智能体
├── 数据 BI           → /data-bi              [已实现]
├── 素材中心           → /material-center       [已实现]
│    ├── 未打标素材    → /unmark
│    ├── 已打标素材    → /mark
│    ├── 标签管理      → /tag
│    └── 品牌管理      → /brand
├── 品牌管理           → /brand/*               [已实现]
│    ├── 品牌库        → /library
│    ├── 品牌车型      → /model
│    └── 经销商管理    → /dealer
├── 团队管理           → /team-management       [已实现]
│    ├── 账户管理      → /account-management
│    ├── 优化师管理    → /optimizer-management
│    ├── 数据专员管理  → /data-specialist-management
│    └── PMO 管理      → /pmo-management
├── 系统账号管理       → /sys-account-management [已实现]
│    ├── 用户管理      → /user-management
│    ├── 角色管理      → /role-management
│    └── 部门管理      → /department-management
└── 系统               → /sys
     ├── 登录          → /auth/login
     └── 错误页        → /403, /404, /500
```

### 8.2 模块状态与迭代规划

| 版本 | 模块 | 状态 | 预期内容 |
|------|------|------|----------|
| v1.0.0 | 登录认证 | ✅ 已完成 | 账号密码、飞书登录、验证码 |
| v1.0.0 | 品牌库管理 | ✅ 已完成 | 品牌 CRUD、大区管理、操作日志 |
| v1.0.0 | 经销商管理 | ✅ 已完成 | 门店 CRUD、状态变更、日志 |
| v1.0.0 | 品牌车型管理 | ✅ 已完成 | 车型 CRUD、导出 |
| v1.0.0 | 系统账号管理 | ✅ 已完成 | 用户/角色/部门管理 |
| v1.0.0 | 团队管理 | ✅ 已完成 | 账户/优化师/数据专员/PMO |
| v1.0.0 | 数据 BI | ✅ 已完成 | 统计卡片、柱状图、中国地图 |
| v1.0.0 | 素材中心 | ✅ 已完成 | 未打标/已打标素材管理 |
| v1.1.0 | 国际化 | 🔲 规划中 | i18n 多语言支持 |
| v1.1.0 | 消息中心 | 🔲 规划中 | 站内信、通知推送 |
| v1.2.0 | 审批流程 | 🔲 规划中 | 品牌上线/下线审批 |
| v1.2.0 | 数据导出增强 | 🔲 规划中 | 自定义报表、定时导出 |
| v2.0.0 | 微前端改造 | 🔲 规划中 | 按业务域拆分独立部署 |

---

## 九、项目制兼容方案

### 9.1 定制化策略

项目已内建「前端路由模式」和「后端路由模式」双模架构，天然支持项目制定制交付：

| 能力 | 实现方式 | 配置位置 |
|------|----------|----------|
| 菜单定制 | 后端路由模式动态生成 | `GLOBAL_CONFIG.routerMode = "backend"` |
| 品牌色定制 | 7 种预设色板切换 | `settingStore.themeColorPresets` |
| 功能裁剪 | 环境变量特性开关 | `.env.*` 中 `VITE_ENABLE_*` |
| 应用标题 | 环境变量配置 | `VITE_APP_TITLE` |
| 默认路由 | 环境变量配置 | `VITE_APP_DEFAULT_ROUTE` |
| 权限控制 | RBAC 角色-菜单-权限 | `rbac/permissions.ts` |

### 9.2 项目制交付流程

```
标准产品（master）
  │
  ├── 1. Fork 项目分支: project/client-name
  ├── 2. 修改环境变量: 品牌名、API 地址、默认路由
  ├── 3. 切换路由模式: backend（后端菜单驱动）
  ├── 4. 定制主题色板: 匹配客户品牌色
  ├── 5. 功能开关: 启用/禁用特定模块
  └── 6. 独立部署: 配置独立域名和网关
```

### 9.3 多租户扩展预留

| 层面 | 当前状态 | 扩展方向 |
|------|----------|----------|
| 数据隔离 | 单租户 | 请求头注入 Tenant-ID |
| 主题定制 | 预设色板 | 租户级自定义色板 |
| 功能开关 | 环境变量 | 租户级特性配置 |
| 路由定制 | 前端/后端模式 | 租户级菜单配置 |

---

## 十、安全设计

### 10.1 认证与授权

| 机制 | 实现 | 说明 |
|------|------|------|
| 登录认证 | 密码 + 验证码 / 飞书 OAuth | AES-CFB 加密传输密码 |
| Token 管理 | accessToken + refreshToken | 双 Token 机制 |
| 万象 Token | wxAccessToken | 独立系统 Token |
| 权限校验 | RBAC | 角色-菜单-操作权限 |
| 路由守卫 | LoginAuthGuard + AuthGuard | 二级守卫 |

### 10.2 数据安全

| 措施 | 说明 |
|------|------|
| 密码加密 | AES-CFB 模式加密（16 字节密钥） |
| Token 存储 | localStorage + Zustand persist |
| 文件上传 | OSS 预签名 URL + MD5 校验和 |
| 生产构建 | 移除 console/debugger，不生成 Source Map |
| HTTPS | 生产环境强制 HTTPS |

---

## 十一、性能优化策略

### 11.1 已实施

| 策略 | 实现方式 |
|------|----------|
| 路由懒加载 | `React.lazy` + `Suspense` |
| 代码分割 | Vite `manualChunks` 四组 |
| 依赖预构建 | Vite `optimizeDeps.include` |
| 动画延迟加载 | `MotionLazy` 组件 |
| CSS 代码分割 | Vite `cssCodeSplit: true` |
| 生产优化 | 移除 console、esbuild 压缩 |
| 预加载 | Vite 自动模块预加载 |

### 11.2 推荐后续优化

| 策略 | 优先级 | 说明 |
|------|--------|------|
| 图片 CDN | 高 | 静态资源走 CDN 加速 |
| 组件虚拟化 | 高 | 长列表使用虚拟滚动 |
| API 请求去重 | 中 | TanStack Query 已内建 |
| Bundle 分析 | 中 | 已集成 rollup-plugin-visualizer |
| PWA 支持 | 低 | 离线缓存与安装 |
| SSR/SSG | 低 | 首屏性能提升（需评估改造成本） |

---

## 十二、测试策略

### 12.1 当前状态

| 类型 | 状态 | 工具 |
|------|------|------|
| 单元测试 | 🔲 未配置 | 推荐 Vitest |
| 组件测试 | 🔲 未配置 | 推荐 React Testing Library |
| E2E 测试 | 🔲 未配置 | 推荐 Playwright |
| Mock 测试 | ✅ 已配置 | MSW |
| 性能分析 | ✅ 已配置 | react-scan（开发环境） |

### 12.2 推荐测试策略

```
                        ┌──────────┐
                        │  E2E     │  ← 核心业务流程
                       ┌┴──────────┴┐
                       │  集成测试    │  ← 页面级交互
                      ┌┴────────────┴┐
                      │   组件测试     │  ← 业务组件
                     ┌┴──────────────┴┐
                     │    单元测试      │  ← 工具函数、Hooks
                     └────────────────┘
```

---

## 十三、部署架构

### 13.1 部署流程

```
代码提交 → Git Push
  │
  ├── Lefthook 预提交检查（Biome lint + format）
  │
  ├── CI/CD Pipeline
  │    ├── pnpm install
  │    ├── tsc 类型检查
  │    ├── vite build
  │    └── Docker 镜像构建
  │
  └── K8s 部署
       ├── 测试环境: pnpm deploy:test
       ├── 预发环境: pnpm deploy:staging
       └── 生产环境: pnpm deploy:prod
```

### 13.2 部署环境

| 环境 | 域名 | 说明 |
|------|------|------|
| 测试 | `api-test.example.com` | 测试验证 |
| 生产 | `api.example.com` | 正式环境 |

---

## 十四、后续迭代路线图

### Phase 1：v1.1.0（基础增强）

- [ ] 完善国际化（i18n）基础设施
- [ ] 消息中心模块
- [ ] 单元测试基础设施搭建（Vitest + RTL）
- [ ] 完善 API 层错误处理与重试机制
- [ ] 图片资源 CDN 化

### Phase 2：v1.2.0（业务深化）

- [ ] 审批工作流
- [ ] 数据导出增强（自定义报表）
- [ ] 操作日志增强（全局操作审计）
- [ ] E2E 测试核心流程覆盖
- [ ] 性能监控接入（Web Vitals）

### Phase 3：v2.0.0（架构升级）

- [ ] 微前端改造评估
- [ ] 多租户支持
- [ ] 设计系统沉淀（独立组件库）
- [ ] 低代码配置能力
- [ ] 灰度发布能力

---

## 附录

### A. 关键文件索引

| 文件 | 说明 |
|------|------|
| `src/main.tsx` | 应用入口 |
| `src/App.tsx` | 根组件，Provider 组装 |
| `src/global-config.ts` | 全局配置常量 |
| `src/routes/sections/index.tsx` | 路由汇总 |
| `src/api/apiClient.ts` | API 客户端封装 |
| `src/store/userStore.ts` | 用户状态管理 |
| `src/store/settingStore.ts` | 设置状态管理 |
| `src/theme/theme-provider.tsx` | 主题 Provider |
| `src/theme/tokens/color.ts` | 色彩设计令牌 |
| `vite.config.ts` | Vite 构建配置 |
| `biome.json` | 代码规范配置 |

### B. 环境变量清单

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_APP_TITLE` | 应用标题 | 星动智能体 |
| `VITE_APP_DEFAULT_ROUTE` | 默认路由 | /ai-dashboard/user-dashboard |
| `VITE_APP_PUBLIC_PATH` | 公共路径 | / |
| `VITE_APP_API_BASE_URL` | API 基础地址 | /api |
| `VITE_APP_ROUTER_MODE` | 路由模式 | frontend |
| `VITE_API_BASE_URL` | 后端 API 地址 | http://localhost:9999/api |
| `VITE_API_WX_URL` | 外部 API 地址 | https://api-test.example.com |
| `VITE_API_BASE_BUSINESS_CODE` | 业务编码 | xdwx |
| `VITE_USE_MOCK_AUTH` | 是否启用 Mock 认证 | false |
| `VITE_ENABLE_PERMISSION_CHECK` | 是否启用权限检查 | false |
| `VITE_ENABLE_MOCK` | 是否启用 Mock | false |

### C. 飞书文档同步说明

本文档采用标准 Markdown 格式编写，兼容飞书文档导入：

1. **飞书文档导入**：打开飞书文档 → 点击「+」→「导入」→ 选择「Markdown」→ 上传本文件
2. **注意事项**：
   - 飞书对 Markdown 代码块支持良好，无需调整
   - 表格格式可直接导入
   - Mermaid 图表需在飞书中手动替换为飞书流程图
   - 复选框列表（`- [ ]`）会自动转换为飞书任务列表
3. **持续同步**：建议将此文档纳入 Git 版本管理，每次迭代更新后重新导入飞书
