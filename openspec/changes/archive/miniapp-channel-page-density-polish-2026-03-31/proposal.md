## Why

当前小程序频道页虽然功能可用，但页面仍然存在明显的“重复感”和“空白感”：头部链路容易给人双标题/双返回的观感，筛选区像一整块厚重控制面板，列表卡片信息不多却占高偏大，导致整体密度低、节奏松，和当前登录页、首页重构后的更轻量风格不一致。现在需要把频道页收敛成单一头部、轻工具带和更紧凑的信息列表，避免页面继续显得层级过多、空白过多。

## What Changes

- 将 `工程建设 / 政府采购 / 信息公开` 频道页的结构收敛为“单一头部 + 轻工具带 + 信息列表”，明确禁止重复标题链路和重复返回语义。
- 将频道页顶部控制区从“大白卡面板”改成更轻的工具带结构，收紧二级 tab、搜索框和筛选按钮的尺寸、边框和间距。
- 将频道页列表卡片改成更紧凑的列表密度，压缩标题、标签、来源、发布时间之间的垂直节奏，并弱化收藏心形的存在感。
- 保持频道页现有的数据加载、筛选、搜索和分页逻辑不变，只调整视觉层级与页面密度。
- 将对稿验收基线更新为“白底 secondary header + 轻工具带 + 更密的卡片列表”，并要求先确认截图来自最新构建，避免旧缓存误判。

## Capabilities

### New Capabilities
- `miniapp-channel-page-density-family`: 定义频道页作为二级信息列表页时的单一头部、轻工具带和紧凑列表密度要求。

### Modified Capabilities
- `miniapp-page-family-headers`: 二级页面头部要求收敛为单一标题链路，不得叠加额外的大标题或重复返回语义。
- `miniapp-home-card-presentation`: `BidCard` 在频道/收藏等列表上下文中应支持更紧凑的列表卡密度，而不是延续较厚的信息卡节奏。

## Impact

- 影响代码：`miniapp/src/styles/channel-page.scss`、`miniapp/src/pages/construction/index.tsx`、`miniapp/src/pages/government/index.tsx`、`miniapp/src/pages/information/index.tsx`、`miniapp/src/components/SecondaryTabs/index.scss`、`miniapp/src/components/FilterBar/index.scss`、`miniapp/src/components/BidCard/index.scss`。
- 不影响 API、频道筛选参数、数据结构和页面路由。
- 会影响频道页和可能复用 `BidCard` 的列表页截图基线，需要重新在微信开发者工具中基于最新构建验收。
