## 1. Auth Family Shell

- [x] 1.1 提炼登录页中可复用的认证页共享样式层，包括品牌区、主卡片、输入控件、主按钮和次级文本规则。
- [x] 1.2 收口登录页样式，使其继续作为认证页样板，同时保持与全站 `variables.scss`、`base.scss`、`TopBar` 的白蓝轻量体系一致。

## 2. Register Page Alignment

- [x] 2.1 重构 `miniapp/src/pages/register/index.tsx` 页面结构，将品牌区、主卡片、重提交流程提示和长表单整理为认证页家族布局。
- [x] 2.2 调整 `miniapp/src/pages/register/index.scss` 与相关表单样式，使注册页输入框、textarea、按钮和文字层级向登录页样板对齐。

## 3. Audit Status Page Alignment

- [x] 3.1 重构 `miniapp/src/pages/audit-status/index.tsx`，移除页首独立 intro，将状态标题、步骤、资料信息、驳回原因和按钮收进状态主卡。
- [x] 3.2 调整 `miniapp/src/pages/audit-status/index.scss`，让审核状态页使用认证家族的品牌区、主卡片和按钮体系，并把状态色限制在局部状态模块。

## 4. Verification

- [x] 4.1 重新编译小程序，确认登录、注册、审核状态三页在新的认证页家族样式下均可正常渲染。
- [ ] 4.2 在微信开发者工具中对照登录、注册、审核状态页，确认三页布局不同但样式语言统一，且与首页/频道页的全站风格保持一致。
