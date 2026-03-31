## Why

当前小程序注册页会读取设备本地保存的注册申请上下文，并在未登录状态下自动查询审核进度、自动跳转到登录页或审核状态页。这让同一台手机难以继续注册其他账号，也把“账号审核状态”错误地绑定到了“这台设备上次注册过谁”。

## What Changes

- 调整小程序注册入口：进入注册页时不再自动读取历史申请上下文，也不再因为本地缓存自动跳转到登录页或审核状态页。
- 调整注册完成后的行为：注册成功后只给出明确反馈和后续入口，不把设备长期绑定到该次申请状态。
- 保持登录后分流：用户点击登录后，系统再根据该账号当前的审核状态决定进入首页、审核状态页或重新提交注册资料页。
- 收缩本地注册上下文的职责：仅保留当前会话所需的最小信息，移除“未登录阶段自动恢复注册进度”的设备级行为。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `miniapp-auth-page-family`: 注册页入口与注册成功后的反馈方式需要调整，不再在未登录阶段自动恢复设备上的历史申请进度。
- `login-post-auth-routing`: 账号审核状态的判断与跳转收敛到登录成功之后执行，承担 pending/rejected/approved 的页面分流职责。

## Impact

- Affected code:
  - `miniapp/src/pages/register/index.tsx`
  - `miniapp/src/pages/login/index.tsx`
  - `miniapp/src/utils/registration.ts`
  - 可能涉及 `miniapp/src/pages/audit-status/index.tsx` 的入口提示文案
- Affected behavior:
  - 同一台手机可以连续发起多个账号的注册，不会被上一次申请自动拦截。
  - 审核状态判断从设备缓存驱动改为账号登录驱动。
- Affected APIs:
  - 不新增后端接口，沿用现有注册、登录和审核状态接口。
