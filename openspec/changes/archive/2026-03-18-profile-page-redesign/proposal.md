## Why

「我的」页当前布局偏重审核流程，信息重复、视觉层级不清晰，且缺少移动端常见的灰底白卡、头像、功能列表等标准模式。用户反馈页面「很奇怪」。需要按移动端标准设计规范重构，使页面更干净、专业、易用。

## What Changes

- **头部身份区**：增加默认头像（根据法人姓名首字自动生成）、大字号法人姓名、小字号手机号、绿色「已通过」徽章
- **资料摘要**：改为 Flex 左右对齐布局，仅保留登录名、营业执照代码、审核时间（去掉重复手机号）
- **功能列表**：设置、联系客服增加左侧线条风格 Icon、右侧 ChevronRight，强化可点击感
- **退出登录**：独立白卡片或浅红背景按钮，红色文字，明确边界感
- **退出后路由**：退出后留在 Profile 页，清空 audit 相关 state，展示登录表单
- **头像组件**：新增首字母头像组件，法人姓名首字 + 基于 userId 的固定背景色

## Capabilities

### New Capabilities

- `miniapp-avatar-initials`: 根据法人姓名首字与 userId 生成首字母头像，供 Profile 等页使用

### Modified Capabilities

- `miniapp-profile-tab-surface`: 增加退出后留在 Profile 展示登录表单的行为要求；明确头部身份区、资料摘要、功能列表、退出按钮的视觉与布局规范

## Impact

- `miniapp/src/pages/profile/index.tsx`：布局与结构重构
- `miniapp/src/pages/profile/index.scss`：样式重写
- `miniapp/src/components/AppIcon/index.tsx`：新增 chevronright、settings、messagecircle 等图标
- 新增 `miniapp/src/components/AvatarInitials/`：首字母头像组件
