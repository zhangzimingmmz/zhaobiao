## Context

运营后台（admin-frontend）为 Vite + React 单页应用，使用单一 `styles.css` 定义全局样式。主流程页面（Dashboard、Reviews、Companies、Crawl、Runs）使用 `.card`、`.primary-button`、`.table-card` 等类；Articles 模块（ArticlesPage、ArticleEditorPage）使用 `.btn-primary`、`.data-table`、`.badge-*` 等未定义类名，导致样式与主流程割裂。此外，`input/select/textarea { width: 100% }` 在 flex 布局中导致 toolbar 内筛选器堆叠；ErrorState 组件期望 `error` prop 但 Articles 传入 `message`；表格单元格内块级元素导致行高不一；LoadingState/EmptyState 使用与 `.card` 同款样式，视觉过重。

## Goals / Non-Goals

**Goals:**
- 统一 Articles 与主流程的视觉与结构
- 修复 toolbar、表格、卡片、状态组件的布局与样式问题
- 确保 ErrorState 在各处正确展示错误信息

**Non-Goals:**
- 不引入新 UI 库（如 Ant Design、Bootstrap）
- 不改变 API 或后端逻辑
- 不重构整体架构，仅做局部修复

## Decisions

### 1. Articles 模块：改用主系统类名
**选择**：将 ArticlesPage、ArticleEditorPage 中的 `.btn-primary`、`.btn-secondary`、`.btn-sm`、`.btn-danger`、`.data-table`、`.badge-success`、`.badge-default` 替换为主系统类名（`.primary-button`、`.secondary-button`、`.table-card`、`.muted` 等），并调整结构以使用 `.card`、`.stack`、`.toolbar`。

**备选**：在 `styles.css` 中补全 `.btn-*`、`.data-table`、`.badge-*` 定义。  
**理由**：主系统已有完整类名，补全两套会增加维护成本；统一到主系统更简洁。

### 2. Toolbar 内 select 宽度
**选择**：在 `styles.css` 中为 `.toolbar select` 增加 `width: auto` 或 `min-width`，覆盖全局 `input, select, textarea { width: 100% }` 在 toolbar 下的表现。

**备选**：为每个 select 单独加 inline style。  
**理由**：集中用 CSS 覆盖更易维护，且 toolbar 为固定使用场景。

### 3. 表格单元格多行内容
**选择**：将 `{item.companyName}<div className="muted">{item.username}</div>` 改为 `{item.companyName}<br /><span className="muted">{item.username}</span>` 或使用 `display: inline-block` 的 span，避免块级 div 换行导致行高不均。

**理由**：最小改动，保持语义清晰。

### 4. Dashboard 今日概览卡片嵌套
**选择**：将内层 `.table-card` 改为普通 `div` 或使用 `.table-wrapper` 类，仅保留表格容器作用，不应用卡片样式（背景、圆角、阴影）。表格直接置于外层 `.card` 内。

**理由**：减少视觉层级，避免「卡片套卡片」。

### 5. 状态组件样式
**选择**：为 `.state-card` 定义轻量样式（如较小 padding、无阴影或弱阴影），与 `.card` 区分；或新增 `.state-inline` 类供 LoadingState/EmptyState 使用。

**理由**：保持 state-card 语义，通过样式区分用途。

### 6. ErrorState 接口
**选择**：修改 ArticlesPage、ArticleEditorPage 的 `ErrorState` 调用，将 `message={error}` 改为 `error={error}`。不修改 ErrorState 组件以兼容 `message`，避免接口膨胀。

**理由**：组件已明确使用 `error`，调用方应遵循。

## Risks / Trade-offs

- **[Risk]** 修改 Articles 类名可能遗漏部分元素 → **Mitigation**：全文搜索 `btn-`、`data-table`、`badge-` 确保替换完整
- **[Risk]** `.toolbar select` 覆盖可能影响其他场景 → **Mitigation**：仅作用于 `.toolbar` 子元素，作用域明确
- **[Trade-off]** 状态组件轻量化可能使空状态不够醒目 → 可接受，当前大卡片过于突兀
