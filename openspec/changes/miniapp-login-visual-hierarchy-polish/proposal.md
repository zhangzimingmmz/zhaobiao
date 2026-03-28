## Why

当前小程序登录页已经具备完整功能，但视觉上仍然偏平、偏灰、偏组件堆叠，登录表单没有成为明确主视觉，输入框还带有“弱态/禁用态”观感，导致页面不够精致，也不够贴近目标设计稿。现在需要单独收敛登录页的视觉层级与版式语言，避免继续在其他页面调优时把这页拖成新的风格例外。

## What Changes

- 重做登录页的视觉层级，让登录表单成为首屏唯一主模块，品牌区和预览区退为次级区域。
- 把登录输入区改成带独立字段标题、白底细边框的表单样式，移除“灰块输入框”的弱态观感。
- 强化主登录按钮的存在感，并同步弱化注册入口、协议提示和无必要分割元素，减少次级信息抢占视线。
- 收敛登录卡片的内部 spacing、边框和阴影，让容器承载内容而不是抢占注意力。
- 调整底部“最新招采预览”的视觉密度与卡片样式，使其更像正式消息卡片的轻量版，但继续保持登录页辅助区定位。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `miniapp-login-ui`: 调整登录页的视觉层级、字段标题、输入框风格、主次按钮权重和预览区表现。
- `miniapp-auth-page-family`: 更新认证页家族对登录页的表单优先级、轻容器风格和次级信息弱化要求。

## Impact

- Affected code:
  - `miniapp/src/pages/login/index.tsx`
  - `miniapp/src/pages/login/index.scss`
  - `miniapp/src/app.scss`
  - `miniapp/src/components/BidPreviewCard/*`
- No API or data-contract changes.
- No backend, crawler, or database changes.
