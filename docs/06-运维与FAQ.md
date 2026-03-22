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

### 一键部署命令

| 命令 | 说明 |
|------|------|
| `make deploy` | 一键部署：自动 commit + push → 若有 miniapp 变更则编译 → 远程部署 |
| `make deploy MSG="fix: xxx"` | 指定提交信息 |
| `make deploy-remote` | 仅远程部署（不提交、不编译小程序） |
| `DEPLOY_SKIP_COMMIT=1 make deploy` | 跳过提交（仅 push + 编译 + 部署） |
| `DEPLOY_SKIP_MINIAPP=1 make deploy` | 跳过小程序编译 |

小程序编译产出位于 `miniapp/dist`，需在微信开发者工具中手动上传。需确保本地可 SSH 到目标机，且目标机已配置 `.env.backend`。

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

### 手机真机加载不出来

真机预览时请求被拦截或超时，常见原因与排查：

1. **request 合法域名未配置**（最常见）
   - 微信小程序真机**必须**使用已配置的合法域名，无法像开发者工具那样关闭校验。
   - 登录 [微信公众平台](https://mp.weixin.qq.com) → 小程序 → 开发 → 开发管理 → 开发设置 → 服务器域名。
   - 在「request 合法域名」中添加：`https://api-zhaobiao.zhangziming.cn`。
   - 保存后重新编译/预览，或等待几分钟生效。

2. **构建时 API 地址错误**
   - 真机必须请求公网 HTTPS 地址，不能是 `localhost` 或内网 IP。
   - 确认构建命令：`npm run build:weapp` 使用默认 `https://api-zhaobiao.zhangziming.cn`；若本地联调时改过 `miniapp/src/config.ts` 的 baseUrl，需改回或使用 `TARO_APP_API_BASE=https://api-zhaobiao.zhangziming.cn npm run build:weapp` 再构建。

3. **API 公网不可达**
   - 手机需能访问 `https://api-zhaobiao.zhangziming.cn`。在手机浏览器中打开该地址，若打不开则说明网络或 API 有问题。
   - 检查后端部署、Traefik 转发、502 等（见「公网访问 Bad Gateway」）。

4. **超时**
   - 默认请求超时 10 秒。弱网环境下可适当增加 `miniapp/src/services/request.ts` 中的 `timeout`。

### 文章详情「无法打开该图文消息」

点击信息展示中的文章，真机提示「无法打开该图文消息」。

**原因**：web-view 加载 `mp.weixin.qq.com` 需配置业务域名，但该域名为微信自有，无法上传校验文件，故无法通过正常流程配置。

**解决**：已改用微信官方 API `wx.openOfficialAccountArticle` 打开公众号文章，无需配置业务域名。需微信基础库 3.4.8+，一般真机均满足。

### 招投标/信息详情「查看原文」无法在 app 内打开

招投标详情页、信息详情页的「查看原文」通过后端代理在 web-view 中加载，仅需配置**自有** API 域名为业务域名：

1. 登录 [微信公众平台](https://mp.weixin.qq.com) → 小程序 → 开发管理 → 开发设置 → 服务器域名。
2. 在「**业务域名**」中添加：`api-zhaobiao.zhangziming.cn`。
3. 按提示下载校验文件，放置到 API 服务可访问的路径（如 `https://api-zhaobiao.zhangziming.cn/` 根目录），确保能返回该文件。
4. 保存后重新编译/预览，或等待几分钟生效。

无需配置 ggzyjy.sc.gov.cn、ccgp-sichuan.gov.cn 等第三方政府站点，后端代理会代为拉取并返回内容。

**校验文件放置**：将微信提供的 `WxVerify_xxx.txt` 放到项目根目录的 `wx_verify/` 下，确保 `https://api-zhaobiao.zhangziming.cn/WxVerify_xxx.txt` 可访问。可通过环境变量 `WX_VERIFY_DIR` 指定其他目录。

**WebView 显示 `{"detail":"Not Found"}`**：说明请求的 API 路径不存在。确认后端已部署最新代码（含 `GET /api/webview-proxy`），执行 `make deploy` 或 `make deploy-remote` 重新部署；并确认业务域名已配置 `api-zhaobiao.zhangziming.cn`。

### 列表/详情无数据

- 确认数据库有数据：可跑 site1/site2 的 incremental 或 backfill；或检查 `NOTICES_DB` 路径是否正确。

### site1 工程建设正文仍然很乱

如果 `site1_sc_ggzyjy` 的历史公告仍显示为一整段压平文本，通常不是线上代码未生效，而是**历史记录还没有补抓详情页**。

排查思路：

1. 新采集记录应优先带 `_detail`；
2. 历史记录若只存了列表层 `content`，需要额外跑 `detail_backfill`；
3. 优先回填 `002001009`、`002001001`，最后再补 `002002001`。

推荐先做 dry-run：

```bash
python3 -m crawler.site1.tasks.detail_backfill \
  --db data/notices.db \
  --dry-run \
  --batch-size 50 \
  --sleep-seconds 0.3 \
  --max-failures 20
```

正式回填工程建设两类：

```bash
python3 -m crawler.site1.tasks.detail_backfill \
  --db data/notices.db \
  --category 002001009 \
  --category 002001001 \
  --batch-size 50 \
  --sleep-seconds 0.3 \
  --max-failures 20
```

若要补齐 `site1` 三类：

```bash
python3 -m crawler.site1.tasks.detail_backfill \
  --db data/notices.db \
  --batch-size 50 \
  --sleep-seconds 0.3 \
  --max-failures 20
```

执行前建议先备份生产 `notices.db`。

### notices 只保留最近 30 天

当前 notices 采用 30 天保留策略：`publish_time` 早于当前时间 30 天的公告，会被视为 retention 候选。正式删除时会同步清理关联的 `bid` favorites；`articles`、`users`、`enterprise_applications`、`crawl_runs` 不受影响。

先做 dry-run：

```bash
python3 -m crawler.notice_retention --db data/notices.db --days 30
```

正式执行：

```bash
python3 -m crawler.notice_retention --db data/notices.db --days 30 --apply
```

注意事项：

- 第一次生产执行前务必先备份 `notices.db`
- 日常 retention 只做 `DELETE`，不会立刻让 SQLite 文件变小
- 如需真正回收磁盘空间，可在低峰期按周或按月单独执行 `VACUUM`
- 该任务不对运营后台开放直接触发，默认由 scheduler 在低峰期自动执行

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
