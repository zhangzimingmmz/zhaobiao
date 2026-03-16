# 06-运维与FAQ

> **作用**：沉淀部署、排障、历史坑点与运行经验。  
> **给谁看**：运维、开发、值班、新人。  
> **什么时候改**：部署方式、日志/监控入口、事故复盘或复杂 bug 解决、新坑点发现时。  
> **谁改**：开发/测试/运维均可补；建议有 owner 统一整理。  
> **是否 review**：需要；模块 owner 或运维负责人过目即可。

---

## 一、部署

### 环境说明

- 生产-like：单机 Docker Compose，API 与 scheduler 分开容器，共享 `data`、`logs` 挂载。
- 公网：由 100.64.0.7 上 Traefik 将 admin 与 api 域名转发至 100.64.0.5:8091、100.64.0.5:8000。

### 打包与发布

- 使用仓库内 `Dockerfile.backend`、`docker-compose.backend.yml`；复制 `.env.backend.example` 为 `.env.backend` 并替换 `ADMIN_TOKEN`、`JWT_SECRET` 等。
- 构建后 `docker compose --env-file .env.backend -f docker-compose.backend.yml up -d --build`。

### 配置来源

- 环境变量：`.env.backend`；API 需 `NOTICES_DB`、`JWT_SECRET`、`ADMIN_TOKEN` 等；admin-frontend 需 `ADMIN_FRONTEND_API_BASE` 指向 API 公网地址。

### 日志与监控

- API/crawler 日志：容器内或挂载的 `logs/`、`logs/admin-crawl/`。
- 健康检查：对 API 请求 `GET /openapi.json`；无专用 `/health` 时以此为准。

### 回滚

- 停容器、保留 data/logs 挂载；可回退到同仓库单机源码运行，使用同一 `data/notices.db` 与 `logs/`。

---

## 二、FAQ 与常见问题

### 小程序/前端请求 404 或跨域

- 检查 baseUrl 是否指向正确 API 地址；生产是否已配置 request 合法域名。
- 本地开发需在微信开发者工具中关闭「校验合法域名」。

### 列表/详情无数据

- 确认数据库有数据：可跑 site1/site2 的 incremental 或 backfill；或检查 `NOTICES_DB` 路径是否正确。

### 采集任务一直 queued 或失败

- API 单实例：同一时间只处理一个 run；查看 API 日志与 `logs/admin-crawl/` 对应 run 日志。
- site2 依赖代理与验证码：代理不可用或验证码失败会导致失败，需检查网络与站点可访问性。

### 管理端 403

- 确认请求头带 `Authorization: Bearer <ADMIN_TOKEN>`，且与后端配置的 ADMIN_TOKEN 一致。

### 已知限制

- 单机 SQLite；API 单点；scheduler 依赖 API 可用；大批量或高危采集动作需受控，不开放给后台直接执行。

---

## 三、更详细的部署步骤

完整步骤、迁移、公网域名接入、首次部署验证等见原 [生产部署架构.md](./生产部署架构.md)。
