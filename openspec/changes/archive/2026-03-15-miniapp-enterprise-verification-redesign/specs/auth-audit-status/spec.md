## MODIFIED Requirements

### Requirement: 审核状态查询（需鉴权）
`GET /api/auth/audit-status` SHALL 需要有效 Bearer token，并始终返回当前用户企业认证状态机快照。成功路径下 `data.status` SHALL 为 `none`、`pending`、`approved`、`rejected` 之一，同时返回前端可直接消费的 `nextAction`。

#### Scenario: 已登录但未提交认证
- **WHEN** 携带有效 token 请求 `/api/auth/audit-status`，且当前用户无企业认证申请记录
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "status": "none", "nextAction": "submit" } }`

#### Scenario: 审核中状态
- **WHEN** 当前用户最新企业认证申请状态为 `pending`
- **THEN** 响应 HTTP 200，body 中 `data.status` 为 `"pending"`，`data.nextAction` 为 `"view"`，并返回 `companyName`、`creditCode`、`contactPhone`、`createdAt`

#### Scenario: 审核通过状态
- **WHEN** 当前用户最新企业认证申请状态为 `approved`
- **THEN** 响应 HTTP 200，body 中 `data.status` 为 `"approved"`，`data.nextAction` 为 `"done"`，并返回 `companyName`、`creditCode`、`contactPhone`、`auditTime`

#### Scenario: 审核驳回状态
- **WHEN** 当前用户最新企业认证申请状态为 `rejected`
- **THEN** 响应 HTTP 200，body 中 `data.status` 为 `"rejected"`，`data.nextAction` 为 `"resubmit"`，并返回 `companyName`、`creditCode`、`contactPhone`、`rejectReason`

#### Scenario: 未携带 token
- **WHEN** 请求时 `Authorization` 头为空或缺失
- **THEN** 响应 HTTP 200，body 为 `{ "code": 401, "message": "请先登录" }`
