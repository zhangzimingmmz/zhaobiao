## Why

运营后台存在两个功能重复的企业审核页面（"企业审核" /reviews 和 "企业目录" /companies），造成用户困惑和代码冗余。两个页面展示相同的数据，但缺少清晰的职责划分和功能差异化。需要优化页面定位，提升审核效率。

## What Changes

- 保留两个页面，但明确职责分离：ReviewsPage 作为审核工作台，CompaniesPage 作为企业管理目录
- 重命名菜单项：将 "企业审核" 改为 "审核队列"，"企业目录" 改为 "企业管理"
- 为 CompaniesPage 添加状态筛选器（支持按 pending/approved/rejected 筛选）
- CompaniesPage 默认显示全部状态，而非仅待审核
- 抽取共用组件减少代码重复（企业信息卡片、状态标签、表格列定义）

## Capabilities

### New Capabilities
- `enterprise-status-filter`: 企业管理页面的状态筛选功能，支持按审核状态筛选企业列表

### Modified Capabilities
<!-- 无需修改现有 capability 的需求，仅优化现有功能的实现 -->

## Impact

**前端影响**：
- `admin-frontend/src/components/Layout.tsx`: 更新菜单项名称
- `admin-frontend/src/pages/CompaniesPage.tsx`: 添加状态筛选器，更新 API 调用
- `admin-frontend/src/pages/ReviewsPage.tsx`: 保持现有功能，可能抽取共用组件

**后端影响**：
- 无需修改后端 API（`/api/admin/companies` 和 `/api/admin/reviews` 已支持 status 参数）

**用户体验影响**：
- 菜单项名称更清晰，职责更明确
- 企业管理页面增加筛选能力，提升查询效率
- 减少用户在两个页面间切换的困惑
