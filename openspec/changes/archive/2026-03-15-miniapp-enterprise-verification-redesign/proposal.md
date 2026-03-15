## Why

当前企业认证虽然已经能跑通，但对用户来说仍然偏重：需要手动填写较多字段，注册页、审核状态页、我的页之间的关系也不够清晰。对于这个小程序，更合适的目标不是“做一套很重的企业入驻系统”，而是先把**用户侧认证体验**压缩到最少步骤，并把审核结果清楚地回流到小程序端。

## What Changes

- 将企业认证重构为“登录后的一步式认证”流程，默认依附当前登录账号，而不是独立的匿名注册动作。
- 精简提交字段，认证以企业名称、统一社会信用代码、营业执照为核心证明；联系人手机号默认复用当前登录手机号，联系人姓名降为可选。
- 约束同一用户的企业认证生命周期：审核中不可重复提交，驳回后基于上次资料重提，通过后默认只读展示。
- 调整审核状态接口，使前端可以直接拿到当前认证快照和明确的下一步动作信息。
- 优化“我的”页、注册页、审核状态页之间的认证入口和状态衔接，减少重复跳转和重复填写。
- 将审核处理能力留给独立的后台 change，本 change 只消费审核结果，不负责定义审核台本身。

## Capabilities

### New Capabilities
- `enterprise-verification-flow`: 定义登录后企业认证的最小提交流程、状态流转、重提规则和页面入口约束

### Modified Capabilities
- `auth-register`: 企业认证提交改为面向已登录用户的精简字段模型，并限制重复提交策略
- `auth-audit-status`: 审核状态返回值补充前端所需的认证快照和动作语义
- `page-api-wiring`: “我的”页、注册页、审核状态页对企业认证状态的展示和跳转规则需要随新流程调整

## Impact

- 小程序前端：[/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/register/index.tsx](/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/register/index.tsx)、[/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/audit-status/index.tsx](/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/audit-status/index.tsx)、[/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/profile/index.tsx](/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/profile/index.tsx)
- 后端认证接口：`POST /api/auth/register`、`GET /api/auth/audit-status`
- 数据存储：企业认证申请表可能需要支持“当前有效申请/最近一次申请”的更新策略
- 文档与联调：前后端接口文档、认证状态文案、审核动作说明需要同步
- 依赖关系：后台审核能力需要由独立的 `admin-enterprise-review-center` change 提供闭环
