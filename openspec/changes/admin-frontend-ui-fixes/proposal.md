## Why

运营后台（admin-frontend）存在多处样式与交互问题：设计系统碎片化（Articles 模块使用未定义类名）、表单控件在 flex 布局中表现异常、组件接口不一致、表格与卡片层级混乱，导致多个页面观感「奇怪」且体验不统一。需要统一修复，提升可读性与专业感。

## What Changes

- 统一设计系统：Articles、ArticleEditor 页面改用主系统类名（`.primary-button`、`.secondary-button`、`.card`、`.table-card` 等），或补全缺失类定义
- 修复 ErrorState 传参：ArticlesPage、ArticleEditorPage 将 `message` 改为 `error`，确保错误信息正确展示
- 修复 toolbar 中 select 布局：在 `.toolbar select` 上限制宽度，避免 `width: 100%` 导致筛选器纵向堆叠
- 优化表格单元格：多行内容使用内联结构，减少块级元素导致的垂直对齐与行高不一致
- 优化卡片嵌套：Dashboard 今日概览中，避免 `card` 内再嵌套完整样式的 `table-card`
- 优化状态组件：LoadingState、EmptyState 使用更轻量的视觉样式，避免大卡片仅显示一行文字

## Capabilities

### New Capabilities

- `admin-frontend-ui-consistency`: 运营后台各页面的样式与布局统一，包括设计系统、表单控件、表格、卡片、状态组件的视觉与结构规范

### Modified Capabilities

- 无（仅视觉与布局调整，不改变现有 spec 级行为）

## Impact

- **admin-frontend/**：`src/styles.css`、`src/pages/*.tsx`、`src/components/States.tsx`
- **无 API 变更**
- **无依赖变更**
