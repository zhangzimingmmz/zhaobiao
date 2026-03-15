## MODIFIED Requirements

### Requirement: 账号密码登录
`POST /api/auth/login` SHALL 接受 `{ "username": "登录名", "password": "登录密码" }` 请求体，校验账号存在、密码正确且审核状态已通过，仅在满足全部条件时返回 JWT token。

#### Scenario: 审核通过账号登录成功
- **WHEN** 提交正确的 `username` 与匹配的 `password`，且账号状态为 `approved`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "token": "<JWT>", "userId": "<id>", "username": "<name>", "mobile": "<phone>" } }`

#### Scenario: 密码错误
- **WHEN** 提交存在的登录名但密码错误
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "账号或密码错误" }`

#### Scenario: 待审核账号尝试登录
- **WHEN** 提交正确的登录名和密码，但账号状态为 `pending`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 403, "message": "账号审核中", "data": { "status": "pending", "applicationId": "<uuid>" } }`

#### Scenario: 驳回账号尝试登录
- **WHEN** 提交正确的登录名和密码，但账号状态为 `rejected`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 403, "message": "账号审核未通过", "data": { "status": "rejected", "applicationId": "<uuid>" } }`

### Requirement: JWT token 有效期
登录成功生成的 JWT token SHALL 设置有效期，默认 7 天；token payload 中包含 `userId`、`username` 和 `mobile`。

#### Scenario: token 过期
- **WHEN** 使用已过期的 token 请求鉴权接口
- **THEN** 响应 HTTP 200，body 为 `{ "code": 401, "message": "token 无效或已过期，请重新登录" }`

#### Scenario: token 无效
- **WHEN** 使用格式错误或签名不匹配的 token
- **THEN** 响应 HTTP 200，body 为 `{ "code": 401, "message": "token 无效或已过期，请重新登录" }`
