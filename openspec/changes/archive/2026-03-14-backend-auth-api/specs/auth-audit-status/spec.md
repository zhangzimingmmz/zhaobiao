## ADDED Requirements

### Requirement: 审核状态查询（需鉴权）
`GET /api/auth/audit-status` SHALL 需要有效 Bearer token，返回当前用户最新的企业认证申请状态；若用户无申请记录则返回 404 错误。

#### Scenario: 已认证用户查询状态
- **WHEN** 携带有效 token 请求 `/api/auth/audit-status`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "status": "pending"|"approved"|"rejected", "companyName": "...", "creditCode": "...", "auditTime": "...", "rejectReason": "..." } }`；`rejectReason` 仅在 status 为 `rejected` 时返回

#### Scenario: 无申请记录
- **WHEN** 携带有效 token 但该用户从未提交注册申请
- **THEN** 响应 HTTP 200，body 为 `{ "code": 404, "message": "未找到认证申请记录" }`

#### Scenario: 未携带 token
- **WHEN** 请求时 `Authorization` 头为空或缺失
- **THEN** 响应 HTTP 200，body 为 `{ "code": 401, "message": "请先登录" }`

#### Scenario: 审核通过状态
- **WHEN** 该用户的申请 status 为 `approved`
- **THEN** `data.status` 为 `"approved"`，`data.auditTime` 为审核时间字符串

#### Scenario: 审核驳回状态
- **WHEN** 该用户的申请 status 为 `rejected`
- **THEN** `data.status` 为 `"rejected"`，`data.rejectReason` 为非空字符串说明驳回原因
