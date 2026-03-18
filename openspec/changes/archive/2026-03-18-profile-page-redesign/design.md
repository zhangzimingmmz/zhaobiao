## Context

「我的」页当前为灰底白卡布局，但头部仅展示登录名（多为手机号）和蓝色「已通过」徽章，资料摘要为纵向堆叠，功能列表无图标与箭头，退出登录为纯文字无边界。用户反馈页面「很奇怪」。项目已有 `$color-bg`、`$color-success`、`$color-error` 等设计 token，以及 `AppIcon` 线条风格图标体系。

## Goals / Non-Goals

**Goals:**
- 采用移动端标准的灰底白卡布局，风格干净、专业、极简
- 头部展示头像 + 法人姓名 + 手机号 + 绿色「已通过」徽章
- 资料摘要 Flex 左右对齐，去掉重复手机号
- 功能列表带 Icon 与 ChevronRight，强化可点击感
- 退出登录为独立卡片或浅红背景按钮
- 退出后留在 Profile，清空 audit state，展示登录表单

**Non-Goals:**
- 不新增后端接口
- 不改变登录/注册/审核状态查询的业务逻辑
- 不实现设置、联系客服的落地页（保持 Toast）

## Decisions

### 1. 头像生成方式
**决策**：首字母头像，取法人姓名首字，背景色由 userId 或 username 的简单 hash 映射到 4–6 种预设色。

**备选**：企业 logo 上传、第三方头像服务。  
**理由**：无需后端与存储，实现简单，与现有数据兼容。

### 2. 颜色映射算法
**决策**：对 `userId` 或 `username` 做字符码累加取模，映射到 `$color-primary`、`$color-success`、`$color-warning` 等已有 token 的浅色背景变体。

**备选**：固定单色、随机色。  
**理由**：同一账号颜色固定，且与设计体系一致。

### 3. 退出后路由
**决策**：留在 Profile 页，清空 `auditData`、`auditStatus`、`nextAction`，展示登录表单。

**备选**：跳转 Login 页、跳转首页。  
**理由**：Profile 为身份中心，内嵌登录表单，无需离开 Tab。

### 4. 徽章颜色
**决策**：「已通过」使用 `$color-success-bg` + `$color-success`（浅绿底深绿字）。

**备选**：保持蓝色 `$color-primary-bg`。  
**理由**：绿色更符合「通过/安全」的语义约定。

### 5. 新增 Icon
**决策**：在 `AppIcon` 中新增 `chevronright`、`settings`、`messagecircle`，用于功能列表与箭头。

**理由**：与现有线条风格一致，无需引入新依赖。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 法人姓名为空时头像显示异常 | 回退到 username 首字或手机号末位，或显示默认占位 |
| 审核中/驳回状态的头部样式 | 复用同一布局，仅徽章文案与颜色不同（pending=黄、rejected=红） |
| 小程序 rpx 与设计稿换算 | 沿用现有 `$font-*`、`$radius-*` 体系，保持一致性 |
