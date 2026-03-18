## 1. Phase 0：基础接入

- [x] 1.1 安装 taro-ui 依赖
- [x] 1.2 在 app.scss 中引入 taro-ui 样式（@import 'taro-ui/dist/style/index.scss'）
- [x] 1.3 覆盖 Taro UI 主题变量，使主色对齐 #1677FF
- [x] 1.4 验证构建与真机运行无报错、无样式冲突

## 2. Phase 1：表单页

- [x] 2.1 用 AtInput、AtButton 重写 login 页，替换 Input、Button
- [x] 2.2 用 AtInput、AtButton、AtTextarea 重写 register 页
- [x] 2.3 用 AtInput、AtButton 重写 profile 页登录区
- [x] 2.4 精简 login、register、profile 中冗余的 input/button 相关样式

## 3. Phase 2：审核与详情

- [x] 3.1 用 AtSteps 重写 audit-status 页进度条
- [x] 3.2 用 AtButton 替换 audit-status 页主操作与次要按钮
- [x] 3.3 用 AtButton 替换 detail、info-detail 页中的按钮（如有）
- [x] 3.4 精简 audit-status 中进度条相关样式

## 4. Phase 3：首页与筛选

- [x] 4.1 评估 FilterBar：用 AtSearchBar 替换搜索 Input，用 AtSegmentedControl 替换招标计划/公告分段
- [x] 4.2 若可行，重写 FilterBar 使用 Taro UI 组件
- [x] 4.3 评估 FilterSheet：AtFloatLayout + AtList 等是否可还原筛选逻辑
- [x] 4.4 若可行，重写 FilterSheet；否则保留自研（部分迁移：AtButton 替换 footer，AtInput 替换 purchaser）
- [x] 4.5 评估 PrimaryTabs、SecondaryTabs 是否用 AtTabs 替换（用 AtSegmentedControl 替换）
- [x] 4.6 更新 index 首页以适配 FilterBar/FilterSheet 变更

## 5. Phase 4：导航与卡片

- [x] 5.1 做 AtTabBar 与 switchTab 的 POC，验证 tab 切换正常（custom-tab-bar + AtTabBar 构建通过，但真机报 View is not defined）
- [x] 5.2 若 POC 通过，用 AtTabBar 替换 BottomNav；否则保留（POC 真机报错，已回退至原生 tabBar）
- [x] 5.3 评估 TopBar 是否用 AtNavBar 或保留自研（保留自研：TopBar 处理 statusBar、胶囊、返回、收藏/分享等定制逻辑）
- [x] 5.4 评估 BidCard、InfoCard 是否用 AtCard 或保留自研（保留自研：卡片结构差异大，自研更贴合业务）
- [x] 5.5 评估 EmptyState 是否用 AtMessage 或保留（保留自研：AtMessage 为 toast 反馈，EmptyState 为列表空态，用途不同）

## 6. Phase 5：收尾

- [x] 6.1 删除 base.scss 中已由 Taro UI 覆盖的 btn-primary、btn-wechat 等（若不再使用）
- [x] 6.2 统一各页面中可能残留的 btn-primary、btn-secondary 等类引用
- [x] 6.3 全量功能回归：登录、注册、审核状态、首页、收藏、筛选、详情等
