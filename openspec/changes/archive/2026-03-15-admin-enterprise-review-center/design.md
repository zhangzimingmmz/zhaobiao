## Context

当前系统已经有企业认证提交和用户侧审核状态查询，但没有任何内部审核入口。结果是：
- 用户提交后只能进入 `pending`
- 审核结果无法通过系统产生
- 企业信息和认证状态只能靠查库或手工改库维护

仓库里目前也没有独立的后台工程，最接近可复用的前端壳子是 [ui](/Users/zhangziming/opt/projects/zhaobiao/ui)。后端则是一个轻量的 FastAPI 服务 [server/main.py](/Users/zhangziming/opt/projects/zhaobiao/server/main.py)。这意味着后台第一版更适合做成一个“内部运营控制台”，而不是完整的 B 端产品。

## Goals / Non-Goals

**Goals:**
- 提供一个最小可用的企业审核中心，让运营/管理员可以处理待审核申请
- 提供企业管理视图，用于查看企业当前认证状态和最近一次申请摘要
- 让小程序侧的 `pending / approved / rejected` 状态真正由后台审核行为驱动
- 记录审核元数据，避免后续只能靠数据库人工排查

**Non-Goals:**
- 不在第一版做复杂的多角色权限体系
- 不在第一版做企业 CRM、客户标签、合同管理等运营功能
- 不做完整的变更申请历史工作流；只保证“当前有效状态 + 最近一次申请”可管理
- 不把爬虫运维能力混进这个 change

## Decisions

### 1. 复用现有 `ui/` 作为 admin 控制台外壳
- **Decision:** 第一版企业审核中心放在 [ui](/Users/zhangziming/opt/projects/zhaobiao/ui) 中，以 `/admin/*` 路由族实现，而不是新建独立前端工程。
- **Why:** 当前仓库里没有 admin frontend，重新起一个工程会扩大范围；`ui/` 已具备 React 路由与页面组织能力，足够承载一个内部控制台。
- **Alternative considered:** 新建 `admin/` 工程。放弃，因为第一版需求更偏内部工具，独立工程成本过高。

### 2. 后台认证先用最小内部鉴权方案
- **Decision:** `/api/admin/*` 与 `/admin/*` 采用最小内部鉴权方案，优先使用环境变量配置的共享管理员身份或最小 admin 登录入口，而不复用小程序用户 JWT。
- **Why:** 审核人员和小程序终端用户不是同一身份域；复用用户 JWT 会把权限边界搞混。
- **Alternative considered:** 直接让审核接口沿用普通用户登录。放弃，因为这会让任何登录用户都可能访问后台审核能力。

### 3. 企业目录基于“当前有效申请视图”，不先拆独立企业主表
- **Decision:** 第一版企业目录从 `enterprise_applications` 与 `users` 聚合得到“当前有效企业视图”，优先满足查询和审核需要，而不是先引入新的 `companies` 主表。
- **Why:** 当前最紧迫的问题是审核闭环，不是复杂企业主数据治理。
- **Alternative considered:** 先设计完整 `companies` / `company_members` 模型。放弃，因为这会显著扩大数据建模范围。

### 4. 审核动作必须写入明确的审计元数据
- **Decision:** 审核通过/驳回时必须写入 `audited_by`、`audit_at`、`reject_reason`、`updated_at` 等字段，且企业目录与用户侧状态都从这些结果读取。
- **Why:** 没有审计元数据，后续无法判断是谁审核、何时审核、为什么驳回。
- **Alternative considered:** 只改 `status` 字段。放弃，因为这不足以支撑运营追踪。

## Risks / Trade-offs

- [Risk] 复用 `ui/` 可能让 admin 界面和用户展示型页面耦合过深 → Mitigation: 通过 `/admin/*` 路由和独立布局隔离，不复用面向终端用户的页面壳层
- [Risk] 最小内部鉴权方案安全性有限 → Mitigation: 明确后台只面向内网/受控环境，后续如有需要再升级到独立 admin 用户体系
- [Risk] 不拆独立企业主表会让后续企业管理扩展受限 → Mitigation: 第一版先输出“当前有效企业视图”，如果出现更复杂企业运营需求，再单独做主数据建模迁移
- [Risk] 审核端和用户端同时修改认证状态契约容易漂移 → Mitigation: 审核动作只产出标准状态机结果，用户侧只消费统一状态快照

## Migration Plan

1. 先补 admin 认证与 `/api/admin/*` 基础路由。
2. 扩展 `enterprise_applications` 表字段，确保审核动作可写入审计元数据。
3. 实现审核列表、详情、通过、驳回 API。
4. 在 `ui/` 下补 `/admin/reviews` 与 `/admin/companies` 页面。
5. 联调小程序的 `audit-status` / `profile`，确认后台审核结果可回流。

## Open Questions

- 审核员是否需要“撤销审核”能力，还是第一版只支持 approve / reject 两种终态操作？
- 已审核通过的企业，如果后续要变更资料，是复用同一条申请，还是另开一个“变更申请”流程？
