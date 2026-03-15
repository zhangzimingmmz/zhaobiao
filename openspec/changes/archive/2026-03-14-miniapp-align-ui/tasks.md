## 1. 图标与基础组件

- [ ] 1.1 新增 Icon 组件或内联 SVG，支持搜索、日历、地图、心形、人形、钱袋、建筑、标签等图标
- [ ] 1.2 在 app.config 中配置首页使用 custom 导航或确保 TopBar 在白底区域可见

## 2. TopBar 改造

- [ ] 2.1 将 TopBar 改为白底、灰色底边框，标题单行
- [ ] 2.2 右侧增加收藏图标（心形）和个人中心图标（人形），替换原「个人中心」文字
- [ ] 2.3 首页 TopBar 点击收藏跳转收藏页，点击人形跳转我的
- [ ] 2.4 详情页 TopBar 支持返回、收藏切换态

## 3. FilterBar 5 种业务态

- [ ] 3.1 首页根据 (primary, secondary) 计算 filterType，传入 FilterBar
- [ ] 3.2 实现 engineering-engineering 布局：招标计划/招标公告按钮行 + 搜索框 + 发布时间/交易来源
- [ ] 3.3 实现 engineering-procurement 布局：搜索框 + 发布时间/交易来源
- [ ] 3.4 实现 procurement-intention 布局：搜索框 + 发布时间/区划
- [ ] 3.5 实现 procurement-announcement 布局：搜索框 + 采购性质/采购方式/发布时间/区划
- [ ] 3.6 实现 information 布局：仅搜索框
- [ ] 3.7 筛选按钮带图标，占位符随业务态变化

## 4. FilterSheet 6 种弹层

- [ ] 4.1 实现 time 弹层：今天、近三天、近一周、近一月及自定义时间段
- [ ] 4.2 实现 source 弹层：全部 + 四川 21 地市州
- [ ] 4.3 实现 region 弹层：四川 21 地市州
- [ ] 4.4 实现 nature 弹层：货物、工程、服务
- [ ] 4.5 实现 method 弹层：公开招标、邀请招标、竞争性谈判等
- [ ] 4.6 实现 purchaser 弹层：输入框搜索
- [ ] 4.7 首页 FilterBar 与 FilterSheet 联动，点击筛选按钮打开对应 type 弹层

## 5. BidCard 完整展示

- [ ] 5.1 增加采购性质、采购方式、预算金额标签展示（蓝/绿/橙）
- [ ] 5.2 增加招标人、区划、截止时间行，带图标
- [ ] 5.3 圆角卡片、边框样式与 ui 一致
- [ ] 5.4 列表接口字段映射：budget、purchaser、regionName、expireTime、purchaseNature、purchaseManner（接口暂无时用 Mock）

## 6. InfoCard 与 BidCardSkeleton

- [ ] 6.1 InfoCard 支持 cover 字段，有则右侧显示封面图
- [ ] 6.2 新增 BidCardSkeleton 组件，模拟 BidCard 布局的占位块
- [ ] 6.3 首页列表 loading 时渲染 3～5 个 BidCardSkeleton

## 7. 收藏列表页

- [ ] 7.1 新增 pages/favorites/index 页面
- [ ] 7.2 在 app.config 中注册 favorites 页面
- [ ] 7.3 实现类型 tab：招标计划、招标公告、采购公告
- [ ] 7.4 列表复用 BidCard，数据来自 /api/favorites 或本地 Mock
- [ ] 7.5 空状态展示

## 8. 详情页完善

- [ ] 8.1 标题卡片：公告类型标签、标题、发布时间
- [ ] 8.2 项目信息区、重要时间区布局与 ui 一致
- [ ] 8.3 公告正文、原文链接按钮样式
- [ ] 8.4 收藏按钮切换态（已收藏/未收藏）

## 9. 集成与联调

- [ ] 9.1 首页集成所有改动：TopBar、FilterBar、FilterSheet、BidCard、BidCardSkeleton、公告类型切换
- [ ] 9.2 确认列表/详情接口字段与展示需求一致，必要时补充 Mock
