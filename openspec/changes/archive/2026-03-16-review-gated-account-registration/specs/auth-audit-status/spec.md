## MODIFIED Requirements

### Requirement: 审核状态查询（无需登录 token）
`GET /api/auth/audit-status` SHALL 不要求 Bearer token，而是要求提供有效的注册申请标识与注册校验信息，用于返回当前注册申请的最新审核状态。

#### Scenario: 待审核用户查询状态
- **WHEN** 提交有效的 `applicationId` 和匹配的注册校验信息查询审核状态
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "status": "pending", "username": "...", "mobile": "...", "creditCode": "...", "legalPersonName": "...", "businessAddress": "...", "nextAction": "wait" } }`

#### Scenario: 审核通过用户查询状态
- **WHEN** 对应申请状态为 `approved`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "status": "approved", "auditTime": "...", "nextAction": "login" } }`

#### Scenario: 审核驳回用户查询状态
- **WHEN** 对应申请状态为 `rejected`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "status": "rejected", "rejectReason": "...", "nextAction": "resubmit" } }`

#### Scenario: 查询凭证不匹配
- **WHEN** `applicationId` 不存在，或注册校验信息与申请不匹配
- **THEN** 响应 HTTP 200，body 为 `{ "code": 404, "message": "未找到注册申请记录" }`

## ADDED Requirements

### Requirement: 审核状态查询 SHALL 服务于未登录用户
审核状态查询能力 SHALL 支持未登录用户在注册后、审核中、驳回后持续查询申请状态，而不需要先完成普通用户登录。

#### Scenario: 注册成功后进入审核状态页
- **WHEN** 用户提交注册资料成功
- **THEN** 前端可基于返回的 `applicationId` 打开审核状态页并继续轮询或查询状态

#### Scenario: 未审核账号无法依赖 token 查询
- **WHEN** 账号状态为 `pending` 或 `rejected`
- **THEN** 系统不得要求该用户先通过登录换取 token 后才能查看审核状态
