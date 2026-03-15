## Context

- **miniapp**：Taro + React 微信小程序，已有首页、详情、登录、注册、审核、我的等页面，使用 `@tarojs/components` 和 SCSS
- **ui**：React + Tailwind 的 Web 参考原型，含 7 页、11 组件、5 种 FilterBar 态、6 种 FilterSheet
- **约束**：小程序无 lucide-react，需用 Taro 图标或自定义 SVG；无 Motion，弹层用 Taro 动画或原生

## Goals / Non-Goals

**Goals:**
- 使 miniapp 视觉与 ui 参考一致（白底顶栏、圆角卡片、政务蓝主色）
- 补齐 5 种 FilterBar 布局、6 种 FilterSheet 内容
- BidCard/InfoCard 展示完整字段（预算、招标人、区划、截止等）
- 新增收藏列表页，支持类型切换
- 列表加载时展示骨架屏

**Non-Goals:**
- 不修改后端 API 契约（仅确认字段可用）
- 不实现真实搜索/筛选逻辑（可先 Mock，接口已有参数）

## Decisions

### 1. TopBar 实现方式
- **选择**：自定义 View 组件，白底 `#fff`，标题 `text-lg`，右侧用 `Image` 或 Taro 内置图标展示收藏、个人中心
- **备选**：使用 `navigationStyle: custom` 完全自定义导航栏
- **理由**：保持与 ui 一致，且不依赖 lucide-react

### 2. FilterBar 5 种业务态
- **选择**：根据 `(primaryTab, secondaryTab)` 计算 `filterType`，与 ui 一致：`engineering-engineering`、`engineering-procurement`、`procurement-intention`、`procurement-announcement`、`information`
- **实现**：每种态渲染不同布局（公告类型按钮、搜索框、筛选按钮组），复用 FilterSheet
- **理由**：与 ui/Home 逻辑一致，便于维护

### 3. 图标方案
- **选择**：使用 Taro 内置图标或 base64 内联 SVG，避免引入 lucide
- **备选**：引入 `@tarojs/icons` 或自定义 icon 组件
- **理由**：小程序包体积敏感，优先轻量方案

### 4. FilterSheet 弹层
- **选择**：使用 Taro `View` + 固定定位 + 遮罩，通过 `visible` 控制显示，内部根据 `type` 渲染不同内容
- **备选**：使用 Taro UI 的 ActionSheet 等
- **理由**：与 ui 的 FilterSheet 结构一致，便于迁移

### 5. BidCard 字段映射
- **选择**：列表接口返回 `budget`、`purchaser`、`regionName`、`expireTime`/`openTenderTime`、`purchaseNature`、`purchaseManner`，与接口文档对齐；若接口暂无，先用 Mock 占位
- **理由**：接口文档已定义，后端可逐步补齐

### 6. 收藏列表页
- **选择**：新增 `pages/favorites/index`，tab 切换「招标计划」「招标公告」「采购公告」，列表复用 BidCard，数据来自 `/api/favorites` 或本地缓存
- **理由**：ui 已有 Favorites 页，接口文档有收藏相关接口

### 7. 骨架屏
- **选择**：新增 BidCardSkeleton 组件，在列表 loading 时渲染 3～5 个占位卡片
- **理由**：与 ui 一致，提升加载体验

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 接口字段缺失 | 先用 Mock 数据展示完整 UI，后端按接口文档补齐 |
| 小程序包体积 | 图标用内联 SVG 或 Taro 内置，避免大图标库 |
| 筛选逻辑复杂 | 先实现 UI 与参数透传，筛选结果可后续接入 |
