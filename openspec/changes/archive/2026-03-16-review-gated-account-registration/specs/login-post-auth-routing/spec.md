## MODIFIED Requirements

### Requirement: 登录成功后获取企业认证状态
系统在用户登录成功后 SHALL 仅对已审核通过的账号进入登录成功链路；待审核或驳回账号不得先保存 token 再查询认证状态。

#### Scenario: 审核通过账号登录成功
- **WHEN** 用户输入正确的登录名和密码，且账号状态为 `approved`
- **THEN** 系统保存登录 token，并允许进入登录后的正常跳转流程

#### Scenario: 待审核账号登录失败
- **WHEN** 用户输入正确的登录名和密码，但账号状态为 `pending`
- **THEN** 系统不得保存 token
- **THEN** 系统应基于登录响应中的 `applicationId` 跳转到审核状态页

#### Scenario: 驳回账号登录失败
- **WHEN** 用户输入正确的登录名和密码，但账号状态为 `rejected`
- **THEN** 系统不得保存 token
- **THEN** 系统应基于登录响应中的 `applicationId` 跳转到注册页或重新提交入口

### Requirement: 根据认证状态自动路由到对应页面
系统 SHALL 按登录响应结果自动分流：仅 `approved` 账号进入首页，`pending` 进入审核状态页，`rejected` 进入重新提交流程。

#### Scenario: 审核中用户登录后跳转到审核状态页
- **WHEN** 登录接口返回 `status=pending`
- **THEN** 系统显示提示"账号审核中"
- **THEN** 系统使用 `redirectTo` 跳转到 `/pages/audit-status/index`

#### Scenario: 被驳回用户登录后跳转到注册页
- **WHEN** 登录接口返回 `status=rejected`
- **THEN** 系统显示提示"账号审核未通过，请重新提交资料"
- **THEN** 系统使用 `redirectTo` 跳转到 `/pages/register/index`

#### Scenario: 已认证用户登录后跳转到首页
- **WHEN** 登录接口返回成功 token
- **THEN** 系统显示提示"登录成功"
- **THEN** 系统使用 `switchTab` 跳转到 `/pages/index/index`

### Requirement: 跳转时显示明确的用户提示
系统 SHALL 在登录结果分流前显示明确的提示信息，告知用户是登录成功、审核中还是需要重新提交资料。

#### Scenario: 显示审核中提示
- **WHEN** 登录接口返回待审核状态
- **THEN** 系统使用 `Taro.showToast` 显示"账号审核中"

#### Scenario: 显示驳回提示
- **WHEN** 登录接口返回驳回状态
- **THEN** 系统使用 `Taro.showToast` 显示"账号审核未通过，请重新提交资料"
