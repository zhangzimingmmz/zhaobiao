# Spec: admin-reviewer-management

## Purpose
定义超级管理员对 reviewer 账号的日常维护能力，包括查看、创建、改密和启停用，确保审核员身份不再依赖环境变量做日常管理。

## Requirements
### Requirement: 超级管理员 SHALL 管理审核员账号列表

系统 SHALL 提供 reviewer 账号管理能力，且该能力仅允许 `super_admin` 访问。超级管理员进入 reviewer 管理页面后，必须能够看到当前 reviewer 账号的基础信息与状态，用于日常维护和权限核对。

#### Scenario: 超级管理员查看审核员列表

- **WHEN** `super_admin` 打开 reviewer 管理页面
- **THEN** 系统返回 reviewer 账号列表
- **AND** 每条记录至少包含 `adminId`、`username`、`role`、`status`、`createdAt`、`updatedAt`

#### Scenario: 审核员尝试访问审核员列表

- **WHEN** `reviewer` 调用 reviewer 列表接口或进入 reviewer 管理页面
- **THEN** 系统拒绝访问并返回权限不足

### Requirement: 超级管理员 SHALL 创建审核员账号

系统 SHALL 允许 `super_admin` 在后台创建新的 reviewer 账号。新账号创建后必须立即可用于后台登录，并能参与后续审核留痕。

#### Scenario: 超级管理员创建审核员

- **WHEN** `super_admin` 提交新的 reviewer 用户名和密码
- **THEN** 系统创建一条新的 reviewer 账号记录
- **AND** 新账号状态默认为启用
- **AND** 返回可用于后续登录和审核留痕的 `adminId`

#### Scenario: 创建重复用户名的审核员

- **WHEN** `super_admin` 使用已存在的用户名创建 reviewer
- **THEN** 系统拒绝创建
- **AND** 返回用户名冲突错误

### Requirement: 超级管理员 SHALL 重置密码并启用或禁用审核员

系统 SHALL 允许 `super_admin` 对已有 reviewer 执行密码重置和状态变更。被禁用的 reviewer 不得继续登录后台，但其历史审核记录必须仍可解析身份。

#### Scenario: 超级管理员重置审核员密码

- **WHEN** `super_admin` 对某个 reviewer 执行重置密码
- **THEN** 系统更新该 reviewer 的密码凭证
- **AND** reviewer 之后必须使用新密码登录

#### Scenario: 超级管理员禁用审核员

- **WHEN** `super_admin` 将某个 reviewer 设置为禁用
- **THEN** 系统保存该 reviewer 的禁用状态
- **AND** 该 reviewer 后续登录必须被拒绝

#### Scenario: 禁用审核员的历史审核记录

- **WHEN** 一个已禁用 reviewer 的历史审核记录在列表或详情页中被展示
- **THEN** 系统仍然能够解析并显示该 reviewer 的身份信息

### Requirement: 审核员身份解析 SHALL 兼容受管 reviewer 账号

系统 MUST 将 reviewer 管理中的账号信息用于后台审核人展示与登录鉴权，避免 reviewer 从固定环境变量迁移到数据库后出现审核留痕无法识别的问题。

#### Scenario: 新建审核员完成审核

- **WHEN** 一个通过 reviewer 管理页面新建的 reviewer 登录后台并完成审核
- **THEN** 系统允许其登录和审核
- **AND** 审核记录中的 `auditedBy` 与后台展示的审核人信息能够正确映射到该 reviewer
