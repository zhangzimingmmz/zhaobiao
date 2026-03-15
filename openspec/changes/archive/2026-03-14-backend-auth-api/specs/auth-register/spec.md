## ADDED Requirements

### Requirement: 企业注册申请提交
`POST /api/auth/register` SHALL 接受企业信息请求体，将申请写入 `enterprise_applications` 表，初始状态为 `pending`，并返回申请 ID。

请求体字段：
- `companyName`（string，必填）：企业名称
- `creditCode`（string，必填）：统一社会信用代码，18 位
- `contactName`（string，必填）：联系人姓名
- `contactPhone`（string，必填）：联系电话，11 位
- `licenseImage`（string，必填）：营业执照图片 URL 或 base64

#### Scenario: 提交完整企业信息
- **WHEN** 提交所有必填字段的注册申请
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "applicationId": "<uuid>", "status": "pending" } }`；数据写入 `enterprise_applications` 表

#### Scenario: 缺少必填字段
- **WHEN** 提交时缺少 `companyName` 或 `creditCode` 等必填字段
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "参数错误：companyName 不能为空" }`（或类似提示）

#### Scenario: 信用代码格式不正确
- **WHEN** 提交的 `creditCode` 不是 18 位
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "统一社会信用代码格式不正确" }`

### Requirement: 注册申请数据库表
`enterprise_applications` 表 SHALL 包含字段：`id`（UUID 主键）、`user_id`（关联 users 表）、`company_name`、`credit_code`、`contact_name`、`contact_phone`、`license_image`、`status`（pending/approved/rejected）、`reject_reason`（可空）、`created_at`、`audit_at`（可空）。

#### Scenario: 建表幂等
- **WHEN** 服务启动时执行建表 DDL
- **THEN** 若表已存在则不报错（`CREATE TABLE IF NOT EXISTS`）
