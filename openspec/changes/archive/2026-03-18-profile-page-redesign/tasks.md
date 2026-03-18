## 1. AvatarInitials 组件

- [x] 1.1 创建 `miniapp/src/components/AvatarInitials/` 组件，接收 `name`、`userId` 或 `username` 参数
- [x] 1.2 实现首字提取逻辑：优先法人姓名首字，空时回退 username 首字或手机号末位
- [x] 1.3 实现基于 userId/username 的 hash 取模，映射到 4–6 种预设背景色（复用 $color-primary、$color-success 等浅色变体）
- [x] 1.4 添加 AvatarInitials 样式（圆形、居中文字、字号）

## 2. AppIcon 扩展

- [x] 2.1 在 AppIcon 中新增 `chevronright` 图标
- [x] 2.2 在 AppIcon 中新增 `settings` 图标
- [x] 2.3 在 AppIcon 中新增 `messagecircle` 图标

## 3. Profile 头部身份区

- [x] 3.1 重构头部为：左侧 AvatarInitials + 右侧姓名/手机号/徽章
- [x] 3.2 使用法人姓名（legalPersonName）作为主显示名，手机号小字号副标题
- [x] 3.3 「已通过」徽章改为 $color-success-bg + $color-success；pending/rejected 保持现有颜色

## 4. Profile 资料摘要

- [x] 4.1 改为 Flex 布局，每行 justify-between，左侧 Label 灰色、右侧 Value 深色右对齐
- [x] 4.2 仅保留登录名、营业执照代码、审核时间，去掉手机号、法人姓名（已在头部展示）
- [x] 4.3 审核时间继续使用 formatAuditTime 格式化

## 5. Profile 功能列表

- [x] 5.1 为「设置」「联系客服」添加左侧 Icon（settings、messagecircle）
- [x] 5.2 为每项添加右侧 chevronright 箭头
- [x] 5.3 调整样式，强化可点击感（padding、视觉分隔）

## 6. Profile 退出登录

- [x] 6.1 将退出按钮改为独立白卡片或浅红背景按钮，红色文字，居中，有边界感
- [x] 6.2 在 handleLogout 中清空 auditData、auditStatus、nextAction
- [x] 6.3 确保退出后展示登录表单（不跳转）

## 7. 样式与收尾

- [x] 7.1 确保页面背景为 $color-bg（灰底），卡片为白底
- [x] 7.2 版本号保持底部居中、小字号、浅灰
- [x] 7.3 重新构建小程序并验证
