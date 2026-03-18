# Design: 运营后台 Ant Design 统一重构

## Context

运营后台 (`admin-frontend`) 已引入 antd 5 与 @ant-design/pro-components，部分页面（审核队列、企业目录、文章编辑）已使用 ProTable、Form、Button 等组件。其余页面仍使用原生 HTML 元素（`<table>`、`<select>`、`<input>`、`<button>`）配合 `styles.css` 中的自定义类（`primary-button`、`secondary-button`、`table-card`、`runs-table` 等），导致：

- 视觉与交互风格不统一
- 表格无内置分页、筛选、列配置等能力
- 表单无校验、错误提示等标准能力
- 维护两套样式体系

## Goals / Non-Goals

**Goals:**

- 所有运营后台页面统一使用 Ant Design / Pro Components
- 表格类页面（内容管理、运行记录）使用 ProTable，获得内置搜索、分页、列配置
- 表单类页面（登录、采集控制）使用 Form + Input/Select，获得校验与统一交互
- 详情类页面（运行详情、审核详情）使用 Card、Descriptions、Typography
- 移除或收敛仅被重构页面使用的自定义 CSS 类

**Non-Goals:**

- 不改变业务逻辑、API 契约、路由结构
- 不引入新依赖（antd、pro-components 已存在）
- 不调整 ProLayout、已有 ProTable 页面的实现

## Decisions

### 1. 表格页面：ProTable + request 模式

**决策**：ArticlesPage、RunsPage 使用 ProTable，通过 `request` 回调调用现有 API，返回 `{ data, total, success }`。

**理由**：与 ReviewsPage、CompaniesPage 一致，可复用 columns 定义、search 配置、pagination 配置。ProTable 内置筛选表单、分页、刷新，减少手写逻辑。

**备选**：使用 antd Table + 手写筛选/分页。放弃，因 ProTable 已满足需求且与现有页面一致。

### 2. 表单页面：Form + 受控组件

**决策**：LoginPage、CrawlPage 使用 antd Form，字段用 Form.Item 包裹 Input/Select，提交用 `form.validateFields()` 与 `form.getFieldsValue()`。

**理由**：Form 提供校验、错误展示、提交防重复；与 ArticleEditorPage 已用 Form 的模式一致。

**备选**：保持原生 form + useState。放弃，因无法复用 Form 能力。

### 3. 详情页面：Card + Descriptions

**决策**：RunDetailPage、ReviewDetailPage 使用 Card 包裹内容，键值对用 Descriptions，JSON 用 Typography.Paragraph + pre 或 Descriptions 多列。

**理由**：Descriptions 适合键值展示，Card 与现有 detail-grid 视觉层级一致。

### 4. 总览：Card + Table

**决策**：DashboardPage 使用 Card 包裹统计与最近运行，表格用 antd Table（或 ProTable 简化版），按钮用 Button。

**理由**：总览为混合布局，Card 分区清晰，Table 展示运行列表即可。

### 5. 反馈：message / Modal 替代 alert / confirm

**决策**：将 `alert()`、`confirm()` 替换为 `message.success()`、`message.error()`、`Modal.confirm()`。

**理由**：与 Ant Design 交互一致，避免浏览器原生弹窗风格割裂。

### 6. 样式清理

**决策**：重构完成后，移除 `styles.css` 中仅被已重构页面使用的类（如 `primary-button`、`secondary-button`、`table-card`、`runs-table`、`link-button` 等）。若其他组件（如 States、Layout）仍引用，则保留。

**理由**：减少冗余 CSS，避免后续误用。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| ProTable request 与现有 API 参数格式不一致 | 在 request 回调中做参数映射，与 ReviewsPage 一致 |
| Form 与现有 state 管理方式不同 | 用 Form 实例替代 useState 管理表单字段，提交时再调用 API |
| 自定义样式被移除后影响未重构组件 | 先 grep 确认引用范围，仅移除无引用的类 |
| 分页/筛选交互变化影响用户习惯 | 保持筛选字段与分页逻辑不变，仅 UI 组件替换 |

## Migration Plan

1. 按页面逐个重构，每完成一页本地验证
2. 不涉及后端、数据库、部署流程变更
3. 回滚：git revert 即可
