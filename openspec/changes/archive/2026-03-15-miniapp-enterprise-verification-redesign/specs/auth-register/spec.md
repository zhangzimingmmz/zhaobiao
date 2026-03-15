## MODIFIED Requirements

### Requirement: 企业注册申请提交
`POST /api/auth/register` SHALL 要求有效 Bearer token，并接受企业认证最小资料集，将当前登录用户的企业认证申请写入或更新为最新有效申请，初始状态为 `pending`，返回申请 ID 与最新状态快照。

请求体字段：
- `companyName`（string，必填）：企业名称
- `creditCode`（string，必填）：统一社会信用代码，18 位
- `licenseImage`（string，必填）：营业执照图片 URL 或 base64
- `contactPhone`（string，可选）：联系电话，11 位；若为空则默认使用当前登录手机号
- `contactName`（string，可选）：联系人姓名

#### Scenario: 已登录用户提交最小认证资料
- **WHEN** 携带有效 token 并提交 `companyName`、`creditCode`、`licenseImage`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "applicationId": "<uuid>", "status": "pending", "companyName": "...", "creditCode": "...", "contactPhone": "..." } }`

#### Scenario: 未携带 token
- **WHEN** 请求 `POST /api/auth/register` 时未携带有效 Bearer token
- **THEN** 响应 HTTP 200，body 为 `{ "code": 401, "message": "请先登录" }`

#### Scenario: 缺少最小必填字段
- **WHEN** 提交时缺少 `companyName`、`creditCode` 或 `licenseImage`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "参数错误：companyName 不能为空" }`（或类似提示）

#### Scenario: 信用代码格式不正确
- **WHEN** 提交的 `creditCode` 不是 18 位
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "统一社会信用代码格式不正确" }`

### Requirement: 注册申请数据库表
`enterprise_applications` 表 SHALL 支持当前用户最新有效认证申请的存储，字段至少包含：`id`（UUID 主键）、`user_id`（关联 users 表）、`company_name`、`credit_code`、`contact_name`（可空）、`contact_phone`、`license_image`、`status`（none/pending/approved/rejected 中实际持久化 pending/approved/rejected）、`reject_reason`（可空）、`created_at`、`updated_at`、`audit_at`（可空）。

#### Scenario: 建表幂等
- **WHEN** 服务启动时执行建表 DDL
- **THEN** 若表已存在则不报错（`CREATE TABLE IF NOT EXISTS`）

## ADDED Requirements

### Requirement: 企业认证提交 SHALL 遵守单用户单当前有效申请策略
企业认证提交接口 SHALL 针对当前登录用户执行单当前有效申请策略：审核中不允许重复提交，驳回后允许基于最近一次申请重提，通过后默认拒绝重复提交。

#### Scenario: 审核中重复提交
- **WHEN** 当前登录用户已有 `pending` 状态申请，再次调用 `POST /api/auth/register`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 409, "message": "已有审核中的认证申请", "data": { "status": "pending" } }`

#### Scenario: 驳回后重新提交
- **WHEN** 当前登录用户最近一次申请状态为 `rejected` 并重新提交认证信息
- **THEN** 系统更新该用户的当前有效申请内容，将状态重置为 `pending`，并返回新的待审核快照

#### Scenario: 已认证用户重复提交
- **WHEN** 当前登录用户最近一次申请状态为 `approved` 并再次提交认证请求
- **THEN** 响应 HTTP 200，body 为 `{ "code": 409, "message": "企业认证已通过，如需变更请联系管理员" }`
