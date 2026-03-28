## Why

当前小程序的页面结构和功能链路已经基本稳定，但整体视觉语言仍然明显偏离目标 PDF：首页入口页仍然带有较强的宣传页和组件拼装感，频道页控制区与列表卡片偏厚偏松，登录页与详情页也还没有收敛到更克制、更像原生小程序业务页的节奏。现在需要启动一轮“视觉收敛”变更，把现有功能骨架保留下来，同时把页面样式拉回到 PDF 所要求的白蓝轻量、层级明确、信息密度稳定的体系中。

## What Changes

- 为小程序建立一组明确的视觉收敛规则：减少无意义卡片层级、降低渐变和装饰性颜色竞争、强化标题与正文的层级关系、统一留白和间距节奏。
- 重做首页入口页的顶部结构与频道入口卡，使其从“宣传页 + 卡片列表”收敛为“简洁品牌头部 + 三大业务入口”。
- 定义频道页家族的统一视觉：白底顶部栏、扁平轻量的筛选控制区、更紧凑的列表卡片节奏，以及更符合 PDF 的空态和加载态。
- 收紧登录页的表单、预览轮播和标题区层级，确保表单继续主导，同时让预览区更轻、更像辅助 teaser。
- 调整详情页的头部、首卡、正文区和局部动作，使其从“通用大白卡详情页”收敛到更接近 PDF 的业务详情结构。
- 引入截图对稿和视觉验收要求，避免后续 AI 或开发继续回落到高频默认 UI 模式。

## Capabilities

### New Capabilities
- `miniapp-channel-entry-page`: 首页入口页的视觉结构与频道入口卡规范，包括品牌头部、入口卡层级和首屏留白节奏。
- `miniapp-channel-page-family`: 工程建设、政府采购、信息公开三类频道页的统一视觉家族，包括顶部栏、控制区、列表区与空态。

### Modified Capabilities
- `miniapp-auth-page-family`: 登录页和注册页的次级页面家族需要继续保留表单优先，但收敛到更轻的 PDF 风格视觉节奏。
- `miniapp-primary-navigation-shell`: 一级 tab 页的壳层需要从当前偏宣传和组件化的表现收敛为更克制的导航壳语言。
- `miniapp-page-family-headers`: 一级页和二级页的 header 家族需要统一为更简洁的白底头部语言，减少不必要的蓝底和渐变。
- `miniapp-home-card-presentation`: 频道页与收藏页中的卡片展示节奏、信息密度和标签权重需要收紧并降低组件感。
- `miniapp-notice-detail-pages`: 详情页首卡、正文区和局部动作的视觉层级需要调整为更接近 PDF 的业务详情页表达。

## Impact

- 小程序页面：`miniapp/src/pages/index/*`、`miniapp/src/pages/login/*`、`miniapp/src/pages/construction/*`、`miniapp/src/pages/government/*`、`miniapp/src/pages/information/*`、`miniapp/src/pages/detail/*`、`miniapp/src/pages/info-detail/*`
- 公共组件与样式：`TopBar`、`SecondaryTabs`、`FilterBar`、`BidCard`、`InfoCard`、`EmptyState`、全局视觉 token 与页面家族样式
- 验收方式：需要补充截图对稿和真机视觉核对标准，确保实现结果不再偏向泛化 Web / 后台 UI
