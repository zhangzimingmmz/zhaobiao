## Why

当前招标系统的 API 和运营平台仅通过 `100.64.0.5:8000`、`100.64.0.5:8091` 这类 Tailscale / 内网地址访问，无法作为稳定的公网入口供小程序和外部运营使用。公网入口机 `100.64.0.7` 上已经存在基于 Traefik file provider 的 HTTPS 反向代理能力，现在需要把招标系统正式接入公网域名并统一到可部署、可复用的访问方式上。

## What Changes

- 为招标系统新增基于 `100.64.0.7` Traefik 的公网 HTTPS 暴露方案，将运营平台与 API 分别映射到稳定公网域名。
- 为后端容器化部署补充公网接入所需的环境变量、文档和验证步骤，明确 `100.64.0.7 -> 100.64.0.5` 的入口拓扑。
- 调整 `admin-frontend` 的生产 API base 配置，使其指向公网 HTTPS API 域名，而不是 Tailscale / 内网地址。
- 调整小程序的 API 接入配置与联调文档，使小程序在生产-like 环境下使用公网 HTTPS 域名访问后端接口。

## Capabilities

### New Capabilities
- `public-domain-ingress`: 定义招标系统通过公网 Traefik 暴露 admin frontend 与 API 的 HTTPS 域名、路由与证书约束。
- `miniapp-public-api-domain`: 定义小程序在生产-like 环境下使用公网 HTTPS API 域名访问后端的配置与接入要求。

### Modified Capabilities
- `ui-api-binding`: 前端 API base URL 的要求从“支持本地配置”扩展为“同时支持本地开发与公网生产域名配置”。

## Impact

- 受影响代码与配置：`docker-compose.backend.yml`、`.env.backend.example`、`admin-frontend` 构建配置、`miniapp` API 配置、部署与联调文档。
- 受影响系统：`100.64.0.7` 上的 Traefik file-provider 动态配置、`100.64.0.5` 上的后端与运营平台服务。
- 受影响外部依赖：公网 DNS、Let's Encrypt 证书签发、微信小程序合法域名配置。
