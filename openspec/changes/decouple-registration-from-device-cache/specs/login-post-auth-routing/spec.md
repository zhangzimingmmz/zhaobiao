## MODIFIED Requirements

### Requirement: 登录成功后获取企业认证状态
系统在用户登录成功后 SHALL 自动调用企业认证状态接口，获取当前登录账号的认证状态；未登录阶段 SHALL NOT 依赖设备本地注册缓存提前决定注册进度或审核状态。

#### Scenario: 登录成功后成功获取认证状态
- **WHEN** 用户输入正确的登录凭证并点击登录
- **THEN** 系统保存登录 token 后立即调用当前用户的企业认证状态接口
- **THEN** 系统获取到该账号的认证状态（none/pending/rejected/approved）

#### Scenario: 获取认证状态接口失败
- **WHEN** 用户登录成功但认证状态接口调用失败或超时
- **THEN** 系统显示“登录成功”提示
- **THEN** 系统降级跳转到首页，让用户通过“我的”页面查看认证状态

### Requirement: 根据认证状态自动路由到对应页面
系统 SHALL 在登录成功后根据当前账号的企业认证状态自动跳转到对应页面；注册页 SHALL NOT 在未登录阶段基于设备缓存主动承担该分流职责。

#### Scenario: 未认证用户登录后跳转到企业认证页
- **WHEN** 用户登录成功且认证状态为 `none`（未提交认证）
- **THEN** 系统显示提示“登录成功，请完成企业认证”
- **THEN** 系统使用 `redirectTo` 跳转到 `/pages/register/index`

#### Scenario: 审核中用户登录后跳转到审核状态页
- **WHEN** 用户登录成功且认证状态为 `pending`（审核中）
- **THEN** 系统显示提示“登录成功，账号审核中”
- **THEN** 系统使用 `redirectTo` 跳转到 `/pages/audit-status/index`

#### Scenario: 被驳回用户登录后跳转到企业认证页
- **WHEN** 用户登录成功且认证状态为 `rejected`（审核未通过）
- **THEN** 系统显示提示“登录成功，请完成企业认证”或等效的重新提交流程提示
- **THEN** 系统使用 `redirectTo` 跳转到 `/pages/register/index`

#### Scenario: 已认证用户登录后跳转到首页
- **WHEN** 用户登录成功且认证状态为 `approved`（审核通过）
- **THEN** 系统显示提示“登录成功”
- **THEN** 系统使用 `switchTab` 跳转到 `/pages/index/index`

### Requirement: 跳转时显示明确的用户提示
系统 SHALL 在登录后状态分流发生前显示明确提示，告知用户当前账号状态和下一步动作。

#### Scenario: 显示登录成功提示
- **WHEN** 用户登录成功
- **THEN** 系统使用 `Taro.showToast` 显示提示信息
- **THEN** 提示信息根据认证状态包含相应的引导文案

#### Scenario: 提示显示后延迟跳转
- **WHEN** 系统显示登录成功提示
- **THEN** 系统等待 500-1000 毫秒后再执行页面跳转
- **THEN** 确保用户能够看到提示信息
