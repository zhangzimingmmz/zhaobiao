## Context

当前后台身份模型已经区分 `super_admin` 和 `reviewer`，但 reviewer 仍然是通过 `.env.backend` 中的固定账号注入。这个方案能解决“谁审核的”留痕，却无法满足日常运营中的账号管理需求：新增审核员、停用离职账号、重置密码都必须登录服务器改环境变量并重建容器。

这次变更需要把“审核员管理”收回到后台系统内部，同时保持现有轻量架构约束不变：

- 仍然不引入完整 RBAC、组织和多角色配置后台
- 仍然保留 `super_admin` 作为最高权限唯一入口
- reviewer 管理必须由 `super_admin` 独占，不能反向开放给 reviewer

## Goals / Non-Goals

**Goals:**

- 让 `super_admin` 可以在后台查看、创建、启用/禁用 reviewer，并重置 reviewer 密码
- 将 reviewer 账号从环境变量迁移到数据库持久化存储，避免每次账号变更都重建服务
- 保持后台登录、审核人留痕、审核人展示与新的 reviewer 账号模型兼容
- 在后台壳层提供明确的 reviewer 管理入口，并按角色控制可见性

**Non-Goals:**

- 不在本阶段引入任意角色配置、权限矩阵编辑或组织归属
- 不支持在后台创建多个 `super_admin`
- 不实现 reviewer 自助改密、找回密码或双因素认证
- 不补完整管理员操作日志中心，只保证 reviewer 账号变更可由 `super_admin` 发起并留存在数据层

## Decisions

### 1. 采用“环境变量 super_admin + 数据库 reviewer”混合模型

`super_admin` 继续由环境变量提供初始账号入口，避免系统在空库时失去最高权限；所有 reviewer 账号迁移到数据库表管理，由后台页面增删改状态。

这样做的原因：

- 能保留当前生产可用的 admin 启动方式
- 不需要先做完整管理员注册流程
- reviewer 账号可以脱离部署流程独立管理

备选方案：

- 全部管理员都改成数据库存储。未采用，因为需要额外解决空库初始化和超级管理员丢失后的恢复路径。
- 继续用环境变量管理 reviewer。未采用，因为这正是当前的核心痛点。

### 2. reviewer 管理范围限定为“列表、创建、重置密码、启用/禁用”

第一阶段不做复杂账号生命周期，只实现最必要的 4 个动作：

- 查看 reviewer 列表
- 创建 reviewer
- 重置 reviewer 密码
- 启用 / 禁用 reviewer

不提供物理删除 reviewer，避免历史审核记录失去可映射身份。禁用即可满足离职和停用场景。

备选方案：

- 允许直接删除 reviewer。未采用，因为旧审核记录中的 `audited_by` 会失去稳定映射。
- 同时支持编辑用户名。未采用，因为用户名既是登录凭证又是审核身份展示源，修改成本高且容易影响审计一致性。

### 3. reviewer 身份显示优先读取数据库账号资料

现有审核列表和详情页已经展示 `auditedByName`。变更后，显示名解析顺序调整为：

1. 数据库中的管理员账号资料
2. 固定 `super_admin` 映射
3. 最后回退到原始 `adminId`

这样可以保证新增 reviewer 在创建后立即能被审核留痕正确展示，而不依赖硬编码映射。

### 4. reviewer 管理入口放入运营设置，并做角色可见性控制

不新增新的顶层高频菜单，而是把 reviewer 管理放到“运营设置”模块下，作为超级管理员专属页面。后台壳层需要显式隐藏 reviewer 对该入口的可见性。

备选方案：

- 将 reviewer 管理放到顶层主导航。未采用，因为该页面是低频管理动作，不应挤占核心运营入口。
- 让 reviewer 也能查看账号列表。未采用，因为账号管理本身属于权限边界的一部分，没必要扩大可见面。

## Risks / Trade-offs

- [数据库 reviewer 与环境变量 reviewer 并存一段时间] → 启动时只保留 `super_admin` 的环境变量入口，reviewer 账号统一以数据库为准，并提供一次性导入策略
- [禁用 reviewer 后旧审核记录无法解析显示名] → reviewer 账号禁用而不删除，历史记录继续可映射
- [超级管理员密码仍只在环境变量中] → 保留当前安全边界，避免这次变更把最高权限恢复链路也一起复杂化
- [后台新增账号管理入口可能扩大误操作面] → reviewer 管理页面只对 `super_admin` 显示，接口层继续做强校验

## Migration Plan

1. 新增后台管理员账号表，至少包含 `id`、`username`、`password_hash`、`role`、`status`、`created_at`、`updated_at`
2. 启动时确保 `super_admin` 仍可通过环境变量登录；如检测到旧的 `ADMIN_REVIEWER1_*` / `ADMIN_REVIEWER2_*` 配置，可受控导入为初始 reviewer
3. 新增 reviewer 管理接口：列表、创建、重置密码、启用/禁用
4. 调整管理员鉴权逻辑，使 reviewer 登录从数据库读取，super_admin 继续走环境变量保底
5. 新增后台 reviewer 管理页面，并在“运营设置”中仅对 `super_admin` 暴露入口
6. 验证新建 reviewer 能登录、能审核、留痕可见；禁用 reviewer 后不可登录但历史审核人展示不丢失

## Open Questions

- reviewer 是否需要 `displayName` 字段，还是第一阶段直接复用 `username` 作为展示名
- 是否需要给 reviewer 管理页补充“最后登录时间”字段，还是放到后续管理员运营增强里再做
