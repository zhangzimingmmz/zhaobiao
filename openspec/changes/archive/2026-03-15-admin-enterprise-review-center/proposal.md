## Why

企业认证如果只有用户提交和用户查状态，而没有审核人员的处理入口，流程会永远停在 `pending`。同时，已注册企业的信息、认证状态和驳回记录也需要一个可管理的运营界面，否则后续只能靠手工查库和改库维持。

## What Changes

- 新增企业审核中心，提供待审核列表、审核详情、通过/驳回操作和驳回原因填写。
- 新增企业管理视图，用于查看已注册企业的当前认证状态、基础信息和最近一次申请快照。
- 为后台补充企业审核相关 API，包括申请列表、申请详情、审核通过、审核驳回。
- 为审核结果补充审计字段，如 `auditedBy`、`auditAt`、驳回原因、最近操作时间。
- 将小程序和用户侧认证流程依赖的审核结果，统一改由后台审核中心产生。

## Capabilities

### New Capabilities
- `admin-enterprise-review`: 审核人员查看认证申请、执行通过/驳回、记录审核结果
- `admin-enterprise-directory`: 后台查看企业档案、认证状态和最近一次申请摘要

### Modified Capabilities

## Impact

- 管理端前端：建议在 [ui](/Users/zhangziming/opt/projects/zhaobiao/ui) 中新增 admin 路由与审核页面，或在同等位置提供一个最小运营控制台
- 后端接口：需要新增 admin 审核相关 API，并为 `enterprise_applications` 增加审核元数据字段
- 数据模型：企业认证申请需要支持审核人、审核时间、最新状态和最近一次申请摘要
- 用户侧联动：小程序的 `audit-status`、`profile` 将消费后台审核结果，而不再依赖手工改库
