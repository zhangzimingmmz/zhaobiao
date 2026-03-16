## MODIFIED Requirements

### Requirement: 企业注册申请提交
`POST /api/auth/register` SHALL 作为匿名注册入口，接受完整账号与企业审核资料，创建账号主体和对应的企业注册申请，初始状态为 `pending`，并返回申请 ID 与状态快照。

请求体字段：
- `username`（string，必填）：注册登录名，需全局唯一
- `password`（string，必填）：注册登录密码
- `mobile`（string，必填）：注册用户手机号码，11 位
- `creditCode`（string，必填）：营业执照代码/统一社会信用代码，18 位
- `legalPersonName`（string，必填）：法人姓名
- `legalPersonPhone`（string，可选）：法人电话号码，11 位
- `businessScope`（string，可选）：营业执照经营范围
- `businessAddress`（string，必填）：经营场所地址

#### Scenario: 提交完整注册资料
- **WHEN** 匿名用户提交完整且格式合法的注册资料
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "applicationId": "<uuid>", "status": "pending", "username": "<name>" } }`

#### Scenario: 缺少必填字段
- **WHEN** 提交时缺少 `username`、`password`、`mobile`、`creditCode`、`legalPersonName` 或 `businessAddress`
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "参数错误：username 不能为空" }`（或类似提示）

#### Scenario: 登录名已存在
- **WHEN** 提交的 `username` 已被已有账号使用
- **THEN** 响应 HTTP 200，body 为 `{ "code": 409, "message": "登录名已存在" }`

#### Scenario: 手机号格式不正确
- **WHEN** 提交的 `mobile` 不是 11 位纯数字
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "手机号格式不正确" }`

#### Scenario: 信用代码格式不正确
- **WHEN** 提交的 `creditCode` 不是 18 位
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "统一社会信用代码格式不正确" }`

### Requirement: 注册申请数据库表
账号注册数据 SHALL 拆分保存为账号主体与审核申请两部分：`users` 表至少包含 `id`、`username`、`password_hash`、`mobile`、`account_status`、`created_at`、`updated_at`；`enterprise_applications` 表至少包含 `id`、`user_id`、`credit_code`、`legal_person_name`、`legal_person_phone`（可空）、`business_scope`（可空）、`business_address`、`status`、`reject_reason`（可空）、`created_at`、`updated_at`、`audit_at`（可空）、`audited_by`（可空）。

#### Scenario: 建表与补列幂等
- **WHEN** 服务启动时执行数据库初始化或迁移 DDL
- **THEN** 若目标表或新增字段已存在则不报错，重复执行仍保持兼容

## ADDED Requirements

### Requirement: 注册申请 SHALL 绑定账号审核门禁状态
注册成功后系统 SHALL 将账号门禁状态初始化为 `pending`，在后台审核通过前不得将该账号视为可登录账号。

#### Scenario: 注册后账号进入待审核状态
- **WHEN** 用户首次注册提交成功
- **THEN** `users.account_status` 为 `pending`，对应申请状态也为 `pending`

#### Scenario: 驳回后重新提交
- **WHEN** 已存在且状态为 `rejected` 的账号重新提交注册资料
- **THEN** 系统更新该账号最近一次有效申请内容，并将账号状态重置为 `pending`
