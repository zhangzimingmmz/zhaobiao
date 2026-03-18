## Why

小程序完成 Taro UI 迁移后，探索发现多处样式缺失、文案不一致、颜色硬编码和冗余代码，影响视觉一致性与可维护性。本次变更统一修复这些问题，提升整体观感与代码质量。

## What Changes

- **样式**：补齐首页「加载更多」「已全部加载」样式；统一圆角与颜色变量；移除 form-card 中不必要的 `!important`；清理 profile 未使用样式
- **内容**：统一登录 / 注册 / 我的 页的链接文案；用户协议链接占位（暂无跳转时保持可点击样式）
- **代码**：收藏页「去登录」改用 AtButton 与表单页风格一致；版本号从配置读取（若可行）

## Capabilities

### New Capabilities

- `miniapp-style-content-polish`: 小程序样式与内容一致性规范，涵盖表单、列表、空态、加载态等组件的样式约定与文案规范

### Modified Capabilities

- 无（本次为样式与内容优化，不改变现有 spec 行为契约）

## Impact

- **影响范围**：miniapp 前端样式（app.scss、base.scss、各页面 scss）、部分页面 TSX 文案、EmptyState / BidCard / InfoCard 等组件
- **无 API 变更**：纯前端样式与文案调整
- **无依赖变更**：不新增或升级依赖
