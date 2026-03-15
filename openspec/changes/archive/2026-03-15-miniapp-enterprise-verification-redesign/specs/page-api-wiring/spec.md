## MODIFIED Requirements

### Requirement: profile 页面展示真实用户企业信息
`profile/index.tsx` 的已登录视图 SHALL 调用 `api.auditStatus()` 获取企业认证状态机快照，并根据 `status` 与 `nextAction` 渲染企业认证区，而不是依赖 404 分支推断“未提交认证”。

#### Scenario: 已登录且认证通过
- **WHEN** 用户已登录，`api.auditStatus()` 返回 `status: 'approved'` 与 `nextAction: 'done'`
- **THEN** profile 页面显示真实 `companyName`、`creditCode`，认证状态显示「已认证」，且不再展示常规提交 CTA

#### Scenario: 已登录但审核中
- **WHEN** `api.auditStatus()` 返回 `status: 'pending'` 与 `nextAction: 'view'`
- **THEN** profile 页面显示「审核中」状态和企业认证摘要，并提供跳转审核状态页的入口

#### Scenario: 已登录但认证被驳回
- **WHEN** `api.auditStatus()` 返回 `status: 'rejected'` 与 `nextAction: 'resubmit'`
- **THEN** profile 页面显示驳回原因摘要，并提供进入重新提交页的入口

#### Scenario: 已登录但尚未提交认证
- **WHEN** `api.auditStatus()` 返回 `status: 'none'` 与 `nextAction: 'submit'`
- **THEN** profile 页面显示「未提交企业认证」状态，并提供进入企业认证提交页的入口

#### Scenario: 未登录时不调用接口
- **WHEN** `token` 不存在（未登录）
- **THEN** 直接渲染「未登录」视图，不调用 `api.auditStatus()`

## ADDED Requirements

### Requirement: 注册页与审核状态页 SHALL 遵守统一认证状态流
`register/index.tsx` 和 `audit-status/index.tsx` SHALL 基于同一个企业认证状态机工作，避免用户在 pending / rejected / approved 状态下看到冲突的页面动作。

#### Scenario: rejected 用户进入注册页
- **WHEN** 当前认证状态为 `rejected`，用户进入注册页
- **THEN** 页面使用最近一次认证资料作为默认值，允许用户修正后重新提交

#### Scenario: pending 用户再次尝试发起认证
- **WHEN** 当前认证状态为 `pending`，用户再次点击企业认证入口
- **THEN** 页面优先引导用户查看审核状态，而不是显示新的空白提交表单

#### Scenario: approved 用户访问认证入口
- **WHEN** 当前认证状态为 `approved`，用户访问企业认证入口
- **THEN** 页面默认以只读认证结果或状态页反馈呈现，不继续展示常规提交按钮
