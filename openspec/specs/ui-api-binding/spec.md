# Spec: ui-api-binding

## ADDED Requirements

### Requirement: 前端可配置 API base URL

系统 SHALL 通过环境变量（如 VITE_API_BASE）或配置指定公告 API 的 base URL。开发环境默认指向本地公告 API（如 http://localhost:8000）。数据请求层 MUST 使用该配置拼接完整 URL。

#### Scenario: 开发环境使用本地 API

- **WHEN** VITE_API_BASE 为 http://localhost:8000
- **THEN** 列表与详情请求发往 http://localhost:8000/api/list、http://localhost:8000/api/detail/bid/:id

### Requirement: 首页列表从 API 获取数据

系统 SHALL 将首页列表数据源从 Mock 切换为调用 GET /api/list。首页 MUST 传递 page、pageSize、category 及筛选参数；展示 data.list，并处理加载态与错误态。

#### Scenario: 列表加载成功展示

- **WHEN** /api/list 返回成功且 data.list 非空
- **THEN** 首页展示列表项，包含标题、发布时间、来源等

#### Scenario: 列表加载中显示加载态

- **WHEN** 请求进行中
- **THEN** 显示加载指示（如 skeleton 或 loading）

#### Scenario: 列表加载失败显示错误态

- **WHEN** /api/list 返回错误或网络失败
- **THEN** 显示错误信息或重试入口

### Requirement: 招投标详情页从 API 获取数据

系统 SHALL 将招投标详情页数据源从 Mock 切换为调用 GET /api/detail/bid/:id。详情页 MUST 根据路由参数 id 请求详情；展示返回字段，并处理加载态与错误态。

#### Scenario: 详情加载成功展示

- **WHEN** /api/detail/bid/:id 返回成功
- **THEN** 详情页展示标题、正文、原文链接等

#### Scenario: 详情加载失败显示错误态

- **WHEN** /api/detail/bid/:id 返回 404 或网络失败
- **THEN** 显示错误信息或返回入口

### Requirement: 保留现有设计系统与路由

系统 SHALL 保留现有 UI 路由、组件结构、设计规范与页面信息架构。仅数据来源从 Mock 改为 API，不改变页面布局与交互。

#### Scenario: 路由不变

- **WHEN** 用户访问首页或详情页
- **THEN** 路由路径与切换前一致
