## ADDED Requirements

### Requirement: 首页加载态样式

首页列表底部「已全部加载」「加载更多」区域 SHALL 具有明确的 padding、居中对齐与可点击区域。

#### Scenario: 已全部加载

- **WHEN** 用户滚动到底部且列表已加载完毕
- **THEN** 显示「已全部加载」文案，具有上下 padding 与居中对齐

#### Scenario: 加载更多

- **WHEN** 用户滚动到底部且列表未加载完毕
- **THEN** 显示「加载更多」可点击区域，具有足够 padding 便于点击

### Requirement: 登录/注册/我的文案一致

登录页、注册页、我的（未登录）页中的链接文案 SHALL 与以下规范一致：

- 注册入口：统一为「还没有账号？去注册」
- 审核状态：统一为「查询审核状态」

#### Scenario: 登录页链接

- **WHEN** 用户查看登录页
- **THEN** 显示「还没有账号？去注册」与「查询审核状态」

#### Scenario: 我的页链接

- **WHEN** 用户未登录查看我的页
- **THEN** 显示「还没有账号？去注册」与「查询审核状态」

### Requirement: 颜色使用变量

样式中的颜色 SHALL 使用 `variables.scss` 中定义的 token，而非硬编码十六进制。

#### Scenario: 表单卡片

- **WHEN** 渲染 form-card 或 audit-status 等组件
- **THEN** 背景色、边框色使用 $color-bg、$color-border 等变量

### Requirement: 收藏页去登录按钮

收藏页未登录时的「去登录」入口 SHALL 使用 AtButton 组件，与表单页按钮风格一致。

#### Scenario: 收藏页去登录

- **WHEN** 用户未登录查看收藏页
- **THEN** 「去登录」按钮使用 AtButton type="secondary" 或 primary，样式与登录/注册页一致

### Requirement: 移除未使用样式

profile 页 scss 中未在 TSX 中使用的样式类 SHALL 被移除。

#### Scenario: 未使用样式

- **WHEN** 构建 profile 页
- **THEN** 不存在 __guest-card、__secondary-btn 等未引用样式定义
