## Why

当前小程序登录页已经形成了相对完整的视觉语言，但注册页和审核状态页仍停留在旧的 secondary-page 表单/说明页样式上，导致认证流程三页在同一小程序内呈现出割裂的家族感。现在需要以登录页为认证页样板，统一品牌区、主卡片、表单控件、按钮和状态模块的设计语言，让认证流程既彼此一致，又继续服从整个小程序的白蓝轻量风格。

## What Changes

- 将登录页定义为认证页家族的样式样板，保留其品牌区、主任务卡、输入框和按钮的整体语言，但限制其继续偏离全站母体。
- 重构注册页视觉结构：保留长表单布局，但引入与登录页一致的品牌区、主卡片、输入框、textarea、按钮和次级提示样式。
- 重构审核状态页视觉结构：保留状态逻辑和资料展示，但改成与认证页家族一致的品牌区 + 状态主卡布局，移除旧式页首说明块和割裂的状态块风格。
- 抽取认证页家族共享规则，统一三页在背景、卡片、输入控件、按钮、状态色、文字层级上的设计基线。
- 修正现有登录页 UI capability 的过时要求，使其与当前账号密码登录、注册入口保留、品牌区样板化的现实实现保持一致。

## Capabilities

### New Capabilities
- `miniapp-register-ui`: 规范注册页在认证家族中的品牌区、长表单主卡、重提交流程提示和表单控件表现。

### Modified Capabilities
- `miniapp-auth-page-family`: 认证页家族从通用 secondary-page 表单页升级为以登录页为样板的统一视觉家族。
- `miniapp-login-ui`: 登录页 requirement 改为账号密码登录样板页，移除过时的验证码/去注册移除等旧契约。
- `miniapp-audit-status-page`: 审核状态页 requirement 改为认证家族中的状态主卡页，而不是普通 secondary 说明页。

## Impact

- Affected code:
  - `miniapp/src/pages/login/*`
  - `miniapp/src/pages/register/*`
  - `miniapp/src/pages/audit-status/*`
  - `miniapp/src/app.scss`
  - shared auth-related page styles extracted during implementation
- No API, crawler, or database changes.
- No route changes; only visual structure and page-family contracts change.
