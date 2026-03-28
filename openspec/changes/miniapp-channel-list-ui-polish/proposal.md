## Why

频道页在解决了双导航和基础密度问题之后，仍然不够“好扫”：标题过长、卡片结构重复、辅助信息层级不够弱、筛选模块主次不清，导致页面虽然完整但阅读效率偏低。现在需要继续做纯 UI 层的可扫读性优化，把频道页从“可看”推进到“高效可读”，但暂不引入新的搜索、排序或筛选功能能力。

## What Changes

- 将频道页筛选模块重新组织为更明确的主工具区：搜索框成为主视觉，二级 tab 和筛选按钮形成更清晰的主次关系。
- 优化频道列表卡的视觉层级，强化标题、弱化辅助信息，收紧信息重复感，让用户更容易快速扫读。
- 调整列表卡的元信息排布方式，在不改变现有字段来源和业务逻辑的前提下，提升“标题 + 类型 + 来源/日期”的快速判断效率。
- 继续统一 `工程建设 / 政府采购 / 信息公开` 三个频道页的 UI 节奏，使其更接近成熟的信息列表页，而不是厚重的通用卡片流。
- 明确本次变更只做视觉与布局优化，不新增排序、更多筛选维度、搜索联想或状态标签等功能能力。

## Capabilities

### New Capabilities
- `miniapp-channel-list-scanability`: 定义频道页作为信息列表页时的扫读优先视觉结构，包括主工具区层级、列表元信息组织方式和快速判断节奏。

### Modified Capabilities
- `miniapp-home-card-presentation`: `BidCard` 在频道与收藏等列表场景中应支持更强的扫读层级与更轻的辅助信息表现，而不仅仅是基础密度收紧。

## Impact

- 影响代码：`miniapp/src/styles/channel-page.scss`、`miniapp/src/components/FilterBar/index.scss`、`miniapp/src/components/SecondaryTabs/index.scss`、`miniapp/src/components/BidCard/index.tsx`、`miniapp/src/components/BidCard/index.scss`，以及可能复用 `BidCard` 的收藏页列表表现。
- 不影响 API、数据字段、筛选参数、搜索能力或页面跳转逻辑。
- 会影响频道页和收藏页的列表截图基线，需要重新在微信开发者工具中核对扫读层级和工具区主次。
