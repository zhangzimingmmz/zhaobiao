## ADDED Requirements

### Requirement: 公网入口 SHALL 通过独立 HTTPS 域名暴露运营平台与 API

系统 SHALL 通过 `100.64.0.7` 上的 Traefik 为运营平台前端与后端 API 提供独立的公网 HTTPS 域名，并将请求分别转发到 `100.64.0.5` 上已部署的服务端口。运营平台域名与 API 域名 MUST 指向不同的 router/service，以保持与现有 Traefik file-provider 路由模式一致。

#### Scenario: 运营平台域名命中 admin frontend
- **WHEN** 用户访问运营平台公网域名（例如 `admin-zhaobiao.zhangziming.cn`）
- **THEN** Traefik 将请求转发到 `http://100.64.0.5:8091`，并返回运营平台页面内容

#### Scenario: API 域名命中后端服务
- **WHEN** 客户端访问 API 公网域名（例如 `api-zhaobiao.zhangziming.cn`）下的 `/openapi.json` 或 `/api/*`
- **THEN** Traefik 将请求转发到 `http://100.64.0.5:8000`，并返回后端 API 响应

### Requirement: 公网入口 SHALL 复用现有 Traefik file-provider 与证书解析机制

系统 SHALL 在 `100.64.0.7` 现有 Traefik 部署中通过动态配置文件新增招标系统路由。新增路由 MUST 使用现有 `websecure` 入口点与 `letsencrypt` 证书解析器，而不是引入新的 Ingress 控制方式。

#### Scenario: 动态配置加载后签发 HTTPS 证书
- **WHEN** 招标系统公网域名已解析到 `8.137.19.124` 且动态配置文件被 Traefik 读取
- **THEN** 对应域名可通过 HTTPS 访问，且使用由现有 `letsencrypt` resolver 管理的证书

#### Scenario: 路由风格与现有公网服务一致
- **WHEN** 运维人员检查 Traefik 动态配置
- **THEN** 招标系统路由以独立 `dynamic/*.yml` 文件存在，并采用 `Host(...) -> service -> loadBalancer -> http://100.64.0.5:<port>` 的既有模式
