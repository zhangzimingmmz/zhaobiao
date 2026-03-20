# Proposal: 运营后台统一使用 Ant Design 重构

## Why

运营后台当前存在 UI 实现不一致：部分页面（审核队列、企业目录、文章编辑）已使用 Ant Design / Pro Components，而总览、内容管理、采集控制、运行记录、登录等页面仍使用原生 HTML + 自定义 CSS。这导致视觉与交互风格不统一，维护成本高，且无法复用 Ant Design 的表格、表单、分页等高级能力。

本次变更将把所有未使用 UI 框架的页面重构为 Ant Design / Pro Components，实现全站风格统一与组件复用。

## What Changes

- **总览 (DashboardPage)**：原生 table、button → Card、Table、Button
- **内容管理 (ArticlesPage)**：原生 table、select、input、button → ProTable、Select、Input、Button
- **采集控制 (CrawlPage)**：原生 select、input、button → Form、Select、Input、Button
- **运行记录 (RunsPage)**：原生 table、select、button → ProTable、Select、Button
- **运行详情 (RunDetailPage)**：原生 div、pre → Card、Descriptions、Typography
- **审核详情 (ReviewDetailPage)**：原生 button、textarea → Button、Input.TextArea，保留已有 message
- **登录 (LoginPage)**：原生 input、button → Form、Input、Button

不改变业务逻辑、API 调用与路由结构，仅替换 UI 实现。

## Capabilities

### New Capabilities

- `admin-frontend-ui-framework`: 运营后台所有页面 SHALL 使用 Ant Design 与 Pro Components 实现表单、表格、按钮等控件，不得使用原生 HTML 表单元素（input、select、button、table）搭配自定义 CSS 类。

### Modified Capabilities

- 无。本次为纯实现层重构，不修改现有 spec 的业务需求。

## Impact

- **影响范围**：`admin-frontend/src/pages/` 下 ArticlesPage、CrawlPage、DashboardPage、LoginPage、ReviewDetailPage、RunDetailPage、RunsPage
- **依赖**：已有 antd、@ant-design/pro-components，无需新增
- **样式**：可逐步移除 `styles.css` 中仅被上述页面使用的自定义类（如 `primary-button`、`secondary-button`、`table-card`、`runs-table` 等），保留与 ProLayout、ProTable 等共用的样式
