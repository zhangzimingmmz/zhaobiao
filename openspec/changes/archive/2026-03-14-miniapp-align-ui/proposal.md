# 小程序与 UI 参考对齐提案

## Why

当前微信小程序（miniapp）相对 Web 参考 UI（ui）仅实现了约 30% 的界面与交互。用户反馈小程序界面简陋、信息展示不完整、筛选能力弱，与设计稿和 Web 原型差距明显，影响使用体验和产品一致性。需要系统性地补齐差距，使小程序在视觉、信息密度和功能上与 UI 参考保持一致。

## What Changes

- **TopBar**：从蓝色整栏改为白底顶栏，标题单行显示，右侧增加收藏图标（心形）和个人中心图标（人形），移除重复标题
- **首页二级操作区**：在「工程建设 - 工程建设」下增加「招标计划」「招标公告」可切换按钮行，选中态为蓝底
- **FilterBar**：从统一的 3 个下拉改为 5 种业务态布局，每种包含独立搜索框（占位符随业务变化）、带图标的筛选按钮（发布时间、交易来源、区划、采购性质、采购方式、采购人等）
- **BidCard**：从简单布局升级为圆角卡片，展示双标签（采购性质蓝/采购方式绿）、橙色预算金额、招标人、区划、截止时间、发布时间等，带图标
- **InfoCard**：增加可选封面图展示，保持标题、摘要、发布时间
- **FilterSheet**：补齐 6 种筛选弹层（发布时间、交易来源、区划、采购性质、采购方式、采购人），每种有完整选项
- **收藏列表页**：新增 Favorites 页面，支持按类型（招标计划/招标公告/采购公告）切换
- **Detail 页**：完善项目信息、重要时间、公告正文、原文链接、收藏按钮的视觉与布局
- **骨架屏**：列表加载时展示 BidCardSkeleton
- **底部导航**：首页已有 tabBar，需确保与 UI 的 BottomNav 行为一致（首页/我的）

## Capabilities

### New Capabilities

- `miniapp-topbar`: 白底顶栏，收藏+个人中心图标
- `miniapp-filterbar`: 5 种业务态 FilterBar，搜索框 + 带图标筛选按钮
- `miniapp-bidcard`: 完整 BidCard（双标签、预算、招标人、区划、截止、发布）
- `miniapp-infocard`: InfoCard 支持封面图
- `miniapp-filtersheet`: 6 种筛选弹层完整实现
- `miniapp-favorites`: 收藏列表页及类型切换
- `miniapp-detail-polish`: 详情页视觉与信息完善
- `miniapp-skeleton`: 列表骨架屏

### Modified Capabilities

- （无现有 spec 需修改）

## Impact

- **miniapp/**：TopBar、FilterBar、FilterSheet、BidCard、InfoCard、首页、Detail、新增 Favorites 页、BidCardSkeleton
- **app.config**：新增 favorites 页面路由
- **API**：列表接口需返回 budget、purchaser、regionName、expireTime、openTenderTime、purchaseNature、purchaseManner 等字段；收藏接口需可用
- **接口文档**：确认列表/详情字段与 UI 展示需求一致
