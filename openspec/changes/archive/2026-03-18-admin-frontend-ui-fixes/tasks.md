## 1. 修复 ErrorState 与状态组件

- [x] 1.1 将 ArticlesPage、ArticleEditorPage 的 `ErrorState message={error}` 改为 `error={error}`
- [x] 1.2 为 `.state-card` 定义轻量样式（减小 padding、弱化阴影），与 `.card` 区分

## 2. 修复 Toolbar 与表单控件布局

- [x] 2.1 在 `styles.css` 中为 `.toolbar select` 增加 `width: auto` 或 `min-width: 160px`，覆盖全局 `width: 100%`
- [x] 2.2 为 ArticlesPage 的筛选区域使用 `.toolbar` 类，确保 select/input 并排

## 3. 统一 Articles 模块设计系统

- [x] 3.1 ArticlesPage：将 `.btn-primary`、`.btn-sm`、`.btn-danger` 等替换为 `.primary-button`、`.secondary-button`
- [x] 3.2 ArticlesPage：将 `.data-table` 替换为 `.table-card` 包裹的 `table`，移除未定义类名
- [x] 3.3 ArticlesPage：将 `.badge-success`、`.badge-default` 替换为 `.muted` 或内联样式
- [x] 3.4 ArticlesPage：使用 `.card`、`.stack` 包裹页面结构，移除纯 inline style 布局
- [x] 3.5 ArticleEditorPage：将 `.btn-primary`、`.btn-secondary` 替换为主系统类名
- [x] 3.6 ArticleEditorPage：使用 `.card`、`.stack`、`label` 等主系统结构包裹表单

## 4. 优化表格与卡片

- [x] 4.1 ReviewsPage、CompaniesPage：将单元格内 `<div className="muted">` 改为 `<span className="muted">` 或 `<br />` + span，避免块级换行
- [x] 4.2 DashboardPage：今日概览中，将内层 `.table-card` 改为普通 div 或 `.table-wrapper`，不重复应用卡片样式

## 5. 验证

- [x] 5.1 本地启动 admin-frontend，逐页检查：登录、总览、企业审核、企业目录、内容管理、采集控制、运行记录
- [x] 5.2 确认 toolbar 筛选器并排、表格对齐正常、Articles 与主流程视觉一致
