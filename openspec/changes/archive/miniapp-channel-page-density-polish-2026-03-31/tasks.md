## 1. Header Chain Cleanup

- [x] 1.1 检查 `construction`、`government`、`information` 三个频道页的页面结构，确保只保留 `TopBar` 作为唯一标题链路，不再渲染额外的大标题或重复返回 affordance。
- [x] 1.2 调整频道页共享壳层和 `TopBar` 相关样式，使二级页头与正文之间的过渡更轻，并确认最新构建不再出现旧缓存中的双标题观感。

## 2. Tool Strip Density

- [x] 2.1 收紧 `miniapp/src/styles/channel-page.scss` 中控制区外层容器的 padding、圆角和卡片感，把它改成更轻的工具带。
- [x] 2.2 收紧 `miniapp/src/components/SecondaryTabs/index.scss` 中二级 tab 的高度、字号和激活态表现，避免其继续像独立小卡片。
- [x] 2.3 收紧 `miniapp/src/components/FilterBar/index.scss` 中搜索框、搜索图标块、筛选按钮和它们之间的间距，使工具区整体更薄。

## 3. List Card Compaction

- [x] 3.1 收紧 `miniapp/src/components/BidCard/index.scss` 中标题、标签、来源、发布时间和 footer 的垂直节奏，减少卡片整体高度。
- [x] 3.2 弱化 `BidCard` 收藏心形的尺寸和存在感，并确认频道/收藏等复用列表页不会因卡片压缩而破坏可读性。

## 4. Validation

- [x] 4.1 重新编译小程序，确认频道页相关样式调整不会引入编译错误。
- [ ] 4.2 在微信开发者工具中基于最新构建重新截取频道页，对照确认页面已经呈现“单一头部 + 轻工具带 + 更密列表”的结构，而不是旧缓存里的双标题厚面板形态。
