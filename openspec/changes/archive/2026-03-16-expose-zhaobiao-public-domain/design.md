## Context

当前招标系统已经以容器化方式部署在 `100.64.0.5` 上：

- API 运行在 `100.64.0.5:8000`
- `admin-frontend` 运行在 `100.64.0.5:8091`
- `scheduler` 与 API 同机运行，通过控制面提交 routine crawler 任务

公网入口机 `100.64.0.7`（公网地址 `8.137.19.124`）上已存在独立的 Traefik 部署，配置位于 `/opt/traefik`，并采用以下模式：

- 静态配置：`/opt/traefik/traefik.yml`
- 动态配置：`/opt/traefik/dynamic/*.yml`
- provider 为 file provider，而非 Docker labels
- 默认行为为 `80 -> 443` 跳转，HTTPS 通过 Let's Encrypt 自动签发证书

现有业务系统（如 `zcloud`）也通过 Traefik 动态文件按 `Host(...) -> http://100.64.0.x:port` 的方式转发，因此招标系统的公网接入应复用同一模式，而不是引入新的 Ingress 形态。

当前客户端限制如下：

- `admin-frontend` 通过 `VITE_API_BASE` 在构建期写入 API base URL
- 小程序当前使用 `miniapp/src/config.ts` 中的 `baseUrl` 常量，默认仍是 `http://localhost:8000`
- 小程序真机或线上访问不能使用 Tailscale 地址，必须切到公网 HTTPS 域名，并满足微信 request 合法域名约束

## Goals / Non-Goals

**Goals:**
- 通过 `100.64.0.7` 上的 Traefik 为招标系统提供稳定的公网 HTTPS 入口。
- 为运营平台和 API 分配独立公网域名，并保持与现有 Traefik 动态路由风格一致。
- 让 `admin-frontend` 的生产构建改为使用公网 HTTPS API 域名。
- 让小程序在生产-like 构建和部署文档中明确使用公网 HTTPS API 域名。
- 保持 `100.64.0.5` 上的应用服务继续以内网 / Tailscale 形式暴露，不直接绑定公网地址。

**Non-Goals:**
- 不在本变更中引入多副本高可用、外部数据库或独立 worker 拆分。
- 不在本变更中把前后端统一到单域名 `/api` 反向代理模式。
- 不在本变更中自动化 DNS 供应商或微信后台配置；仅要求文档化和验证。
- 不在本变更中重构业务 API 语义或 crawler 调度逻辑。

## Decisions

### 1. 采用“双域名 + Traefik file-provider”方案

决策：

- `admin-zhaobiao.zhangziming.cn` -> `http://100.64.0.5:8091`
- `api-zhaobiao.zhangziming.cn` -> `http://100.64.0.5:8000`

理由：

- 与现有 `/opt/traefik/dynamic/zcloud.yml` 等配置完全同型，落地成本最低。
- 当前 `admin-frontend` 已经是构建期写入 API base，直接切到独立 API 域名最直观。
- 避免第一阶段引入 `PathPrefix(/api)`、优先级、前端相对路径等额外复杂度。

备选方案：

- 单域名 `admin-zhaobiao.zhangziming.cn` + `/api` 转发
  - 优点：同域更整洁、浏览器侧免跨域
  - 未选原因：需要同时调整前端 API base 为相对路径，并让 Traefik 处理路径优先级；不符合当前最小改动目标

### 2. 公网入口只改 Traefik 动态配置，不改业务 Compose 网络接线

决策：

- 在 `100.64.0.7` 的 `/opt/traefik/dynamic/` 中新增招标系统路由文件
- 不要求业务容器加入 Traefik 网络
- 不通过 Docker labels 管理公网路由

理由：

- 现有 Traefik 明确只启用了 file provider
- 现有路由已经稳定采用 “公网入口机转发到 Tailscale / 内网地址” 模式
- 业务容器无需感知公网入口，职责边界更清晰

备选方案：

- 让 `100.64.0.5` 上的 Compose 直接接入 Traefik labels
  - 未选原因：与当前公网机 Traefik 运维模式不一致，会引入跨机 label 编排问题

### 3. `100.64.0.5` 上的服务继续只绑定内网地址

决策：

- API 继续绑定 `100.64.0.5:8000`
- Frontend 继续绑定 `100.64.0.5:8091`
- 公网流量统一从 `100.64.0.7` 进入

理由：

- 保持现有部署拓扑不变，降低直接暴露应用节点的风险
- 公网暴露、TLS、域名和证书都统一收口在 Traefik
- 回滚时可以只撤销 Traefik 动态配置，不必打断应用容器运行

### 4. Admin Frontend 改为使用公网 HTTPS API 域名

决策：

- 生产构建时的 `VITE_API_BASE` 改为公网 API 域名
- 本地开发仍保留 `localhost` 作为默认或显式覆盖值

理由：

- 前端当前通过 `fetch(${API_BASE}${path})` 组织请求，build-time base URL 是现有自然扩展点
- 不需要额外引入运行时配置加载逻辑

### 5. 小程序改为显式支持公网 HTTPS API base

决策：

- 小程序保留本地联调 `localhost` 或开发配置能力
- 生产-like 配置明确切到公网 HTTPS API 域名
- 优先通过 Taro 构建期环境变量（如 `TARO_APP_API_BASE`）注入，并保留本地默认值作为开发兜底
- 文档中同步要求配置微信 request 合法域名

理由：

- 小程序真机和线上环境不可能访问 `100.64.0.5` 这类 Tailscale 地址
- 现有 `miniapp/src/config.ts` 已经把 `baseUrl` 作为单点配置，而 `miniapp/config/index.ts` 已预留 `defineConstants` 扩展点，适合在不破坏本地开发体验的前提下接入构建期配置

## Risks / Trade-offs

- [DNS 未提前配置或生效延迟] → 先完成 DNS 解析，再启用 Traefik 动态路由并验证证书签发。
- [前端仍指向旧内网地址] → 将公网 API base 写入 `.env.backend` / 构建参数，并在部署后用浏览器网络面板与配置文件双重校验。
- [小程序未同步 request 合法域名] → 在文档中加入微信后台配置步骤，并把合法域名校验列为上线前检查项。
- [Traefik 动态文件语法错误导致全局路由受影响] → 复用现有动态文件风格，变更前后执行 Traefik 配置检查与目标域名探测。
- [双域名带来跨域] → 当前后端已允许 CORS；后续若收紧安全策略，再单独引入明确 allowlist。

## Migration Plan

1. 选定并配置两个公网域名，解析到 `8.137.19.124`。
2. 在 `100.64.0.7` 的 `/opt/traefik/dynamic/` 新增招标系统路由文件，并复用现有 `websecure + letsencrypt` 模式。
3. 调整 `admin-frontend` 生产构建参数，使其使用公网 HTTPS API 域名。
4. 调整小程序 API base 配置与文档，使其在生产-like 构建中使用公网 HTTPS API 域名。
5. 部署前端构建与后端配置后，验证：
   - 两个域名都能返回 `200`
   - 前端接口请求命中公网 API 域名
   - 小程序能通过公网域名完成列表、详情、认证相关请求
6. 回滚时：
   - 先将前端 / 小程序配置切回旧地址或停用新构建
   - 再撤销 Traefik 动态路由文件
   - 如证书已签发，可保留 `acme.json` 记录，不影响后续重试

## Open Questions

- 最终是否固定采用 `admin-zhaobiao.zhangziming.cn` 与 `api-zhaobiao.zhangziming.cn`，还是使用其他命名。
- 公网开放后是否需要同步增加 Trusted Host / 精确 CORS allowlist，这可作为后续安全收口变更。
