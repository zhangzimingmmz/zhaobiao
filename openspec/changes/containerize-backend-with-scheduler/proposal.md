## Why

当前后端更接近“单机源码运行 + 本地 SQLite + 进程内 dispatcher”的形态，适合开发和临时运维，但不利于迁移到新服务器或新环境。现在需要一个可重复、可移植、可审计的部署方案，把 API、例行调度、数据卷和运行约束明确下来，避免每次部署都重新拼接运行方式。

## What Changes

- 定义一套基于 `docker compose` 的后端部署拓扑，明确 `api`、`scheduler`、持久化卷和环境变量边界。
- 定义 routine crawler 的调度方式：`scheduler` 容器按计划提交 run request，而不是直接绕过控制面执行 CLI。
- 明确当前阶段的运行约束，包括 API 单实例、SQLite 本地持久卷、日志持久化、敏感配置外置和健康检查策略。
- 补充部署与运维文档，使新环境可以按同一套架构完成部署、迁移和日常运行。

## Capabilities

### New Capabilities

- `containerized-backend-runtime`: 定义后端在 Docker Compose 下的服务拓扑、调度方式、持久化和运行边界。

### Modified Capabilities

## Impact

- Affected code: `server/`, `crawler/`, deployment manifests, runtime env wiring, and `docs/`
- Affected systems: FastAPI service runtime, crawl dispatcher, scheduled incremental/recovery orchestration, SQLite/log persistence
- Dependencies: container image build inputs, `curl_cffi` runtime dependency for `site2`, Docker Compose, container-friendly scheduler

