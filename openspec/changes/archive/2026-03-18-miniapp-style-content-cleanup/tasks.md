## 1. 首页加载态样式

- [x] 1.1 在 index/index.scss 中新增 __end、__load-more 样式（padding、居中对齐、可点击区域）

## 2. 文案统一

- [x] 2.1 登录页链接文案改为「还没有账号？去注册」与「查询审核状态」
- [x] 2.2 确认 profile 未登录区链接文案与登录页一致

## 3. 颜色变量替换

- [x] 3.1 在 variables.scss 中新增 $color-warning-border（或复用）用于 audit-status
- [x] 3.2 app.scss form-card 中硬编码颜色改为 variables
- [x] 3.3 audit-status 中 #FFD591 改为变量

## 4. 收藏页去登录按钮

- [x] 4.1 收藏页「去登录」改用 AtButton type="primary" 或 secondary

## 5. 移除未使用样式

- [x] 5.1 删除 profile/index.scss 中 __guest-card、__secondary-btn

## 6. form-card 精简（可选）

- [x] 6.1 尝试移除 form-card 中 !important，验证真机样式正常
