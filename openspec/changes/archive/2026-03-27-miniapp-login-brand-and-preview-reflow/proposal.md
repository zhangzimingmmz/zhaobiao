## Why

当前小程序登录页虽然已经具备登录门禁和预览能力，但页面仍然存在明显的层级冗余：顶部标题、eyebrow、主标题和说明文案同时出现，导致“登录”被重复表达，表单也没有成为首屏唯一主角。与此同时，最新招采预览离表单过近，页面信息密度偏高且缺少品牌化首屏，和目标设计稿差距明显。

## What Changes

- 将登录页首屏从“说明文案 + 表单 + 预览”改为“品牌区 + 表单 + 次级预览”结构。
- 移除重复的 eyebrow `登录` 与冗长说明文案，减少首屏文字量。
- 为登录页新增轻品牌区，用于承接 logo / 品牌名和一行简短提示。
- 将“最新招采预览”整体下移，明确其为辅助内容而非首屏主内容。
- 保持现有登录逻辑、注册跳转、协议文案、预览数据来源与点击拦截行为不变。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `miniapp-auth-page-family`: 调整登录页在二级页面家族中的首屏结构，要求 form-first 之外增加轻品牌区，并降低说明文字密度。
- `miniapp-login-ui`: 调整登录页的标题层级、文案数量、品牌展示和预览区位置，使其更接近目标设计稿。

## Impact

- Affected code:
  - `miniapp/src/pages/login/index.tsx`
  - `miniapp/src/pages/login/index.scss`
  - `miniapp/src/styles/base.scss`
  - 可能复用或补充 `miniapp/src/assets/images/` 下的品牌素材
- Affected systems:
  - 微信小程序登录页 UI
- Unchanged systems:
  - 登录接口、审核状态判断、预览数据接口、游客拦截与跳转逻辑
