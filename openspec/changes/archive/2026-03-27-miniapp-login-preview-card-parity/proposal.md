## Why

当前登录页虽然已经具备品牌区、账号密码登录和游客预览，但底部“最新招采预览”仍然像一个临时 teaser，而不是产品内正式信息卡片的轻量版本。与此同时，登录页整体还在自然流布局和强行撑满页面之间来回摇摆，导致表单主次不稳、长屏留白反复出现。

## What Changes

- 将登录页主体骨架明确为带比例约束的三段布局：品牌区、登录区、预览区，其中登录区保持最大视觉权重。
- 将“最新招采预览”改为更接近正式公告卡片的 `BidCard Lite` 形式，而不是当前的简化条目块。
- 将游客预览数据改为按最新 10 条真实数据组织、每页 2 条的双行轮播，同时让单条预览更接近正式列表卡的字段顺序。
- 保持游客点击预览后仅提示登录，不直接进入详情页或频道页。
- 不改登录逻辑、后端接口、审核分流或注册入口流程。

## Capabilities

### New Capabilities
- `miniapp-guest-preview-carousel`: 登录页底部游客预览的展示结构、字段顺序、双行轮播规则与点击门禁。

### Modified Capabilities
- `miniapp-auth-page-family`: 登录页在二级页面家族中的布局规则需要从自然流排布调整为带比例约束的三段骨架，确保表单持续成为主视觉。
- `miniapp-login-ui`: 登录页需要把预览模块改造成更接近正式招采卡片的轻量版本，并重新定义品牌区、表单区、预览区之间的占比关系。

## Impact

- Affected code:
  - `miniapp/src/pages/login/index.tsx`
  - `miniapp/src/pages/login/index.scss`
  - `miniapp/src/components/BidCard/index.tsx`
  - `miniapp/src/components/BidCard/index.scss`
  - 可能新增一个登录页专用的轻量预览卡组件或样式片段
- Affected systems:
  - 微信小程序登录页 UI
  - 游客态预览轮播
- Unchanged systems:
  - 登录 API、审核状态判断、游客点击拦截、详情页与频道页路由
