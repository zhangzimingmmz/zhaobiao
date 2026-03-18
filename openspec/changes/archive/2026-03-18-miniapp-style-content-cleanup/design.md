## Context

小程序已完成 Taro UI 迁移（miniapp-taro-ui-migration），表单、筛选、审核等页面已使用 AtInput、AtButton、AtSearchBar 等组件。探索发现：首页加载态样式缺失、登录/注册/我的文案不一致、颜色硬编码、form-card 过度使用 `!important`、profile 存在未使用样式。本次变更在现有架构上做样式与内容修复，不引入新依赖。

## Goals / Non-Goals

**Goals:**
- 补齐首页「加载更多」「已全部加载」的 padding、对齐、可点击区域
- 统一登录 / 注册 / 我的 页的链接文案
- 用 variables 替换硬编码颜色（#FFD591、#F7F8FA、#E5E7EB 等）
- 精简 form-card 中 `!important`，通过提高选择器优先级或调整加载顺序解决
- 删除 profile 中 `__guest-card`、`__secondary-btn` 未使用样式
- 收藏页「去登录」改用 AtButton 与表单页风格一致

**Non-Goals:**
- 不实现用户协议/隐私政策实际跳转（保持占位文案）
- 版本号从配置读取为可选（若需改动构建配置则暂不实现）

## Decisions

### 1. 首页加载态样式

**决策**：在 `index/index.scss` 中新增 `__end`、`__load-more` 样式，padding 与 text-caption 对齐，确保可点击区域足够。

**备选**：使用 AtLoadMore 组件 → 需引入 Taro UI 并调整现有逻辑，改动较大，暂不采用。

### 2. 颜色变量替换

**决策**：在 `variables.scss` 中已有 `$color-bg`、`$color-border`，在 app.scss 的 form-card 中改用这些变量；audit-status 的 `#FFD591` 可新增 `$color-warning-border` 或复用现有 token。

**备选**：保持硬编码 → 不利于主题统一，不采用。

### 3. form-card 移除 !important

**决策**：form-card 选择器改为 `.form-card .at-input` 等，确保在 taro-ui 之后加载；若仍被覆盖，可考虑将 form-card 样式移入各页面 scss 并提高选择器优先级。

**备选**：保留 !important → 不利于后续维护，不采用。

### 4. 收藏页「去登录」按钮

**决策**：将 `View` + `Text` 替换为 `AtButton type="secondary"`，保持与登录/注册页风格一致。

### 5. 文案统一

**决策**：统一为「还没有账号？去注册」和「查询审核状态」；登录页保留「先去注册并提交审核」可改为「去注册」以与 profile 一致。

## Risks / Trade-offs

- **[风险]** 移除 form-card 的 !important 可能在某些环境下导致样式被覆盖 → **缓解**：先尝试移除，若真机异常再恢复或改用提高选择器优先级
- **[风险]** 版本号从配置读取可能需改动 Taro 构建配置 → **缓解**：列为可选，若实现成本高则暂不处理

## Migration Plan

- 无数据迁移：纯前端样式与文案调整
- 部署：按常规流程构建并发布
- 回滚：git revert 即可

## Open Questions

- 无
