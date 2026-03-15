## ADDED Requirements

### Requirement: 审核中心 SHALL 提供认证申请列表与详情
后台审核中心 SHALL 提供企业认证申请列表和单条详情，供审核人员查看待审核、已通过、已驳回的申请及其关键资料。

#### Scenario: 查看待审核申请列表
- **WHEN** 审核人员进入企业审核中心
- **THEN** 系统展示认证申请列表，至少包含企业名称、统一社会信用代码、当前状态、提交时间

#### Scenario: 查看申请详情
- **WHEN** 审核人员点击某条认证申请
- **THEN** 系统展示该申请的完整审核详情，包括营业执照图片、联系方式、最近状态和最近更新时间

### Requirement: 审核中心 SHALL 支持通过与驳回操作
后台审核中心 SHALL 支持对认证申请执行通过和驳回操作，并将结果写入标准审核元数据。

#### Scenario: 审核通过
- **WHEN** 审核人员在申请详情页点击通过
- **THEN** 系统将该申请状态更新为 `approved`，并写入 `auditedBy`、`auditAt`

#### Scenario: 审核驳回
- **WHEN** 审核人员在申请详情页点击驳回并填写驳回原因
- **THEN** 系统将该申请状态更新为 `rejected`，并写入 `auditedBy`、`auditAt`、`rejectReason`

### Requirement: 审核中心 SHALL 保护审核接口不被普通用户访问
企业审核相关接口 SHALL 只允许后台审核身份访问，不得复用普通小程序用户权限直接调用。

#### Scenario: 非后台身份访问审核接口
- **WHEN** 普通用户或未认证请求访问 `/api/admin/*` 审核接口
- **THEN** 系统拒绝该请求，并返回未授权响应
