## Context

当前后端运行形态依赖整仓库源码、项目根目录下的 SQLite 数据文件，以及 API 进程启动时创建的本地 dispatcher。dispatcher 并不是独立 worker，而是由 `server.main` 在启动阶段创建，并通过 `crawl_control` 以子进程方式执行 `python -m crawler...` 任务。这个结构在单机开发和临时运维上已经可用，但迁移到新服务器时需要重复手工拼装 Python 环境、目录结构、定时调度和敏感配置。

用户已经明确希望采用 `docker compose + scheduler` 方案，以便后续迁移到其他环境时仍可复用相同部署形态。与此同时，当前代码仍有几条不可忽视的边界：

- API 进程内含 dispatcher，当前架构不支持多副本或多 worker。
- 默认数据库仍是本地 SQLite 文件，适合单机持久卷，不适合当前阶段横向扩容。
- 管理控制面已经具备 run queue、运行历史和同站点排他保护；如果定时器绕过控制面直接跑 CLI，会丢失统一审计和互斥保护。
- `site2` 已经依赖 `curl_cffi`，镜像构建时必须把 crawler 运行时依赖补齐。

## Goals / Non-Goals

**Goals:**
- 定义可迁移的 Compose 拓扑，明确 `api`、`scheduler`、持久卷和环境变量的职责边界。
- 让 routine crawler 通过统一控制面执行，保留 run history、排他保护和结果摘要。
- 保持当前单机 SQLite 架构可用，不为 Docker 化额外引入数据库迁移。
- 为后续多环境部署准备稳定的文档和实现边界。

**Non-Goals:**
- 不在本 change 内把 dispatcher 从 API 进程中拆成独立 worker。
- 不在本 change 内把 SQLite 迁移为 Postgres 或其他外部数据库。
- 不在本 change 内引入公网反向代理、HTTPS 终止或多副本高可用。
- 不把高风险维护动作（如 `site2 backfill --formal`）纳入自动调度。

## Decisions

### 1. 使用 `docker compose` 作为第一阶段部署边界

系统将以 Compose 管理至少两个服务：`api` 和 `scheduler`，并为数据库与日志提供持久卷。这样做的原因是当前系统仍然是单机形态，Compose 足够描述服务关系、卷挂载、环境变量和迁移方式，又不会引入 Kubernetes 级别的额外复杂度。

备选方案：
- `systemd + venv`：单机可行，但迁移时依然需要重新拼环境和定时器，不满足“跨环境复制部署形态”的目标。
- 单容器打包所有职责：会把 API 与 cron 强耦合在一起，容器内职责混乱，不利于后续拆分。

### 2. `scheduler` 通过管理 API 提交 routine run，而不是直接执行 CLI

`scheduler` 将按计划调用 `/api/admin/crawl/runs` 提交 `site1.incremental`、`site1.recovery`、`site2.incremental`、`site2.recovery` 等 routine 任务，由 `api` 内 dispatcher 统一认领和执行。这样可以复用现有的：

- action 白名单与参数校验
- 同站点排他保护
- 统一运行历史与结果摘要

备选方案：
- `scheduler` 直接运行 `python -m crawler...`：实现简单，但会绕开 `crawl_runs`、失去统一审计，并允许人工控制面与定时任务并发冲突。

### 3. `api` 保持单实例，dispatcher 继续留在 API 进程内

本 change 不重构 dispatcher 模式。Compose 中的 `api` 服务必须以单实例运行，且不使用多 worker 的 uvicorn 配置。这样做的原因是 dispatcher 当前在进程内启动，如果横向扩容会导致多份 dispatcher 同时 claim 或提交任务，破坏现有执行语义。

备选方案：
- 同步拆分独立 `worker` 服务：长期更干净，但需要重新梳理 claim、心跳、失败恢复和服务发现，超出本 change 范围。

### 4. SQLite 与日志目录通过持久卷保留

Compose 将挂载至少两个持久化目录：数据库目录和日志目录。数据库继续使用 `NOTICES_DB` 指向的 SQLite 文件；crawler 与管理控制面日志写入持久卷。这样做可在容器重建后保留数据、运行历史基础文件和排障日志。

备选方案：
- 容器内临时文件系统：容器重建即丢失数据，不可接受。
- 直接迁移到外部数据库：超出本阶段目标。

### 5. 运行时配置与敏感信息必须外置

Compose 环境将显式提供至少以下变量：`PYTHONPATH`、`NOTICES_DB`、`JWT_SECRET`、`ADMIN_TOKEN`，以及 scheduler 所需的 API 地址与管理员令牌。原因是当前代码仍保留开发默认值，若不外置会在生产-like 环境中留下明显安全隐患。

备选方案：
- 依赖代码内默认值：只适合开发环境，不适合容器化部署。

### 6. 第一阶段健康检查采用轻量可用信号

由于当前没有专用 `/health` 接口，Compose 层健康检查先采用对现有 HTTP 入口或 TCP 监听的轻量探测，而不是在本 change 内强制新增专用健康接口。这样可以先完成部署落地，再决定是否追加显式健康端点。

备选方案：
- 先新增 `/health` 再部署：更理想，但会把部署 change 扩大为 API 行为变更。

### 7. 镜像必须包含完整 crawler 运行时依赖

镜像构建不能只安装 `server` 依赖，因为控制面实际会执行 `crawler.site1.*` 和 `crawler.site2.*`。尤其 `site2` 现在依赖 `curl_cffi`，镜像里必须包含对应运行时依赖，否则 scheduler 成功提交任务后，真实执行阶段仍会在容器内失败。

## Risks / Trade-offs

- [单实例 API 成为单点] → 通过 Compose restart policy、持久卷和最小职责划分降低故障影响；后续若需要再拆独立 worker。
- [SQLite 仍不适合横向扩容] → 本 change 明确单机边界，不对外承诺多副本部署。
- [scheduler 调 API 依赖 API 可用性] → 换来统一队列与审计；routine 调度失败时仍可通过控制面人工补触发。
- [当前无显式 `/health`] → 第一阶段用轻量探测兜底，并在文档里标明限制。
- [容器化并不自动解决代理、网络和站点波动] → 部署文档需明确外部代理与网络配置仍是运行前提。

## Migration Plan

1. 构建包含 `server` 与 `crawler` 依赖的统一镜像。
2. 用 Compose 启动 `api`、`scheduler`，并挂载 `data` 与 `logs` 持久卷。
3. 通过环境变量显式注入数据库路径、管理员令牌和 JWT 密钥。
4. 用 scheduler 定时提交 routine 任务到管理 API，并确认 `crawl_runs` 中能看到对应记录。
5. 保留现有手工维护入口，用于 `backfill`、`reconcile`、`precheck` 等低频操作。
6. 若部署失败，回滚到现有单机源码运行方式；由于数据库与日志位于持久卷或宿主机目录，回滚不需要数据迁移。

## Open Questions

- scheduler 是否直接使用 `ADMIN_TOKEN`，还是单独定义内部调度令牌并在控制面上区分 `triggerSource=scheduler`？
- 第一阶段是否需要为 API 增加显式 `/health`，还是继续接受 Compose 级轻量探测？
- 第二阶段拆分独立 worker 时，是否继续沿用 SQLite 作为 run queue 存储，还是同步迁移到更适合并发 claim 的存储？
