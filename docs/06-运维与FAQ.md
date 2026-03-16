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
- IP 池配置：`crawler/site2/config.py` 中的 `PROXY_EXTRACT_URL`、`PROXY_USER`、`PROXY_PASS` 用于配置青果短效代理的认证信息。

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
- IP 池配置问题：检查 `crawler/site2/config.py` 中的代理认证信息是否正确，青果短效代理 IP 有效期为 60 秒，系统会在 50 秒时主动轮换。
- 代理提取失败：查看日志中是否有 `ProxyError`、`RemoteDisconnected` 等错误，可能是代理服务不可用或认证信息过期。

### 管理端 403

- 确认请求头带 `Authorization: Bearer <ADMIN_TOKEN>`，且与后端配置的 ADMIN_TOKEN 一致。

### 公网访问 Bad Gateway（502）

- 通常表示 Traefik（100.64.0.7）无法从上游 100.64.0.5 获取响应。
- 在 100.64.0.5 上检查：`docker compose ... ps` 确认 api 容器在跑；`curl http://127.0.0.1:8000/openapi.json` 确认本机 API 可访问。
- 在 100.64.0.7 上检查：`curl http://100.64.0.5:8000/openapi.json` 确认 Traefik 能连通上游。
- 若本机正常、跨机不通，检查 Tailscale/防火墙；若 Traefik 配置有误，检查 `/opt/traefik/dynamic/zhaobiao.yml` 是否生效。

#### 案例：端口绑定错误导致 502（2026-03-16）

**现象**：公网访问 `https://api-zhaobiao.zhangziming.cn` 返回 502 Bad Gateway。

**根因**：API 容器端口只绑定在 `127.0.0.1:8000`，未绑定到 `100.64.0.5:8000`。Traefik 从 100.64.0.7 访问 100.64.0.5:8000 时无法建立连接。

**排查**：在 100.64.0.5 上执行 `ss -tlnp | grep 8000`，若显示 `127.0.0.1:8000` 则说明绑定错误。

**修复**：确保 `.env.backend` 中 `API_PUBLISH_BIND=100.64.0.5:8000`，然后重启容器使配置生效：

```bash
cd /opt/zhaobiao  # 或项目实际路径
docker compose --env-file .env.backend -f docker-compose.backend.yml down
docker compose --env-file .env.backend -f docker-compose.backend.yml up -d
```

**说明**：若容器在修改 `.env.backend` 之前启动，会沿用旧端口绑定；必须 `down` 后重新 `up` 才能应用新配置。

### 已知限制

- 单机 SQLite；API 单点；scheduler 依赖 API 可用；大批量或高危采集动作需受控，不开放给后台直接执行。

---

## 三、部署到 100.64.0.5 的步骤

在目标机 `100.64.0.5` 上执行：

### 1. 准备环境

- 安装 Docker 与 Docker Compose
- 克隆或拉取本仓库到目标目录

### 2. 配置环境变量

```bash
cp .env.backend.example .env.backend
```

编辑 `.env.backend`，**必须**替换以下占位符：

- `ADMIN_TOKEN`：强随机字符串
- `JWT_SECRET`：强随机字符串
- `ADMIN_PASSWORD`：管理员登录密码

100.64.0.5 上默认已配置：

- `API_PUBLISH_BIND=100.64.0.5:8000`
- `ADMIN_FRONTEND_PUBLISH_BIND=100.64.0.5:8091`
- `ADMIN_FRONTEND_API_BASE=https://api-zhaobiao.zhangziming.cn`

### 3. 准备持久目录

```bash
mkdir -p data logs
```

### 4. 启动服务

```bash
docker compose --env-file .env.backend -f docker-compose.backend.yml up -d --build
```

### 5. 验证

```bash
# 查看容器状态
docker compose --env-file .env.backend -f docker-compose.backend.yml ps

# 本机验证 API
curl -I http://100.64.0.5:8000/openapi.json

# 本机验证运营平台
curl -I http://100.64.0.5:8091
```

### 6. 公网访问前提

公网域名 `api-zhaobiao.zhangziming.cn`、`admin-zhaobiao.zhangziming.cn` 需在 **100.64.0.7** 上的 Traefik 中配置，将流量转发到 100.64.0.5:8000 和 100.64.0.5:8091。详见 [生产部署架构.md](./生产部署架构.md)。

---

## 四、更详细的部署步骤

完整步骤、迁移、公网域名接入、首次部署验证等见原 [生产部署架构.md](./生产部署架构.md)。
