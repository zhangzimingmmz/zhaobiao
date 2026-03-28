# Spec: admin-reviewer-identity

## Purpose
定义后台管理员身份、角色边界和审核留痕约束，确保多个后台账号并行审核时，权限和操作者身份都可被明确识别与追溯。

## Requirements
### Requirement: 后台 SHALL 支持多个固定管理员账号与角色

系统 SHALL 支持至少 3 个固定后台账号：1 个 `super_admin` 和 2 个 `reviewer`。后台登录成功后返回的管理员 token MUST 携带 `adminId`、`username` 和 `role`，以便后续审核留痕和权限判断使用。

#### Scenario: 审核员登录后台

- **WHEN** 审核员使用已配置的 reviewer 账号密码登录后台
- **THEN** 系统返回登录成功的管理员 token
- **AND** token 中包含该审核员自己的 `adminId`、`username` 和 `role=reviewer`

#### Scenario: 超级管理员登录后台

- **WHEN** 超级管理员使用 admin 账号登录后台
- **THEN** 系统返回登录成功的管理员 token
- **AND** token 中包含 `role=super_admin`

### Requirement: 审核动作 SHALL 写入真实审核人

当后台管理员执行企业申请通过或驳回时，系统 MUST 将当前登录管理员的真实身份写入审核留痕字段，而不能继续写入固定的占位管理员标识。

#### Scenario: reviewer 审核通过

- **WHEN** reviewer 对某个待审核申请执行通过
- **THEN** `enterprise_applications.audited_by` 被写入该 reviewer 的 `adminId`
- **AND** 响应中返回对应的 `auditedBy`

#### Scenario: super_admin 审核驳回

- **WHEN** super_admin 对某个待审核申请执行驳回
- **THEN** `enterprise_applications.audited_by` 被写入该 super_admin 的 `adminId`
- **AND** 驳回原因与审核时间一并留痕

### Requirement: 高风险企业管理动作 SHALL 仅允许超级管理员

系统 SHALL 将测试数据删除、企业档案编辑、申请作废等高风险动作限制为 `super_admin`；`reviewer` 仅拥有审核和查看权限。

#### Scenario: reviewer 尝试删除测试数据

- **WHEN** reviewer 调用删除测试数据或等效高风险接口
- **THEN** 系统拒绝该操作并返回权限不足

#### Scenario: super_admin 执行高风险企业管理动作

- **WHEN** super_admin 调用测试数据删除、企业档案编辑或申请作废接口
- **THEN** 系统允许执行该动作
- **AND** 该动作的操作者身份必须可追溯
