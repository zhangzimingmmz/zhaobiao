# AI Agent 全局规则与文档索引

> **作用**：为 AI 助手（Cursor、Claude、Codex 等）提供项目上下文入口，确保每次协作前掌握文档结构与关键约定。  
> **约定**：Agent 在开始任何任务前，应先读取本文档；涉及具体领域时，再按需读取下方列出的对应文档。

---

## 1. 必读规则

- **每次会话开始**：先读本文档，了解文档分布与项目结构。
- **开发/改代码前**：读 [docs/01-项目导览.md](docs/01-项目导览.md)、[docs/02-系统结构.md](docs/02-系统结构.md)，必要时读 [docs/04-API文档.md](docs/04-API文档.md)、[docs/05-数据库设计.md](docs/05-数据库设计.md)。
- **排障/部署/运维前**：读 [docs/06-运维与FAQ.md](docs/06-运维与FAQ.md)，必要时读 [docs/others/生产部署架构.md](docs/others/生产部署架构.md)。
- **接口精确契约**：以 FastAPI `GET /openapi.json` 或 `http://localhost:8000/docs` 为准；前端/小程序契约见 [docs/others/接口文档-前端与小程序.md](docs/others/接口文档-前端与小程序.md)。
- **变更与规范**：`openspec/changes/` 记录变更过程，`openspec/specs/` 记录能力定义。

---

## 2. 文档索引

### 2.1 主文档（docs/）

| 文档 | 路径 | 用途 |
|------|------|------|
| 文档首页 | [docs/README.md](docs/README.md) | 文档导航、推荐阅读顺序 |
| 项目导览 | [docs/01-项目导览.md](docs/01-项目导览.md) | 快速开始、功能地图、上下游 |
| 系统结构 | [docs/02-系统结构.md](docs/02-系统结构.md) | 架构图、模块职责、依赖关系 |
| 核心流程 | [docs/03-核心流程.md](docs/03-核心流程.md) | 注册、登录、审核、采集等流程 |
| API 文档 | [docs/04-API文档.md](docs/04-API文档.md) | 接口分组、鉴权、关键接口（业务视角） |
| 数据库设计 | [docs/05-数据库设计.md](docs/05-数据库设计.md) | 核心表、表关系、关键字段 |
| 运维与 FAQ | [docs/06-运维与FAQ.md](docs/06-运维与FAQ.md) | 部署、排障、常见问题、历史坑点 |

### 2.2 补充文档（docs/others/）

| 文档 | 路径 | 用途 |
|------|------|------|
| 生产部署架构 | [docs/others/生产部署架构.md](docs/others/生产部署架构.md) | 完整部署步骤、迁移、公网接入 |
| 接口文档-前端与小程序 | [docs/others/接口文档-前端与小程序.md](docs/others/接口文档-前端与小程序.md) | 前端/小程序与后端 API 契约 |
| 后台管理接口文档 | [docs/others/后台管理接口文档.md](docs/others/后台管理接口文档.md) | 管理端接口契约 |
| 功能需求清单 | [docs/others/功能需求清单.md](docs/others/功能需求清单.md) | 产品功能需求（信息查询、收藏、企业备案等） |
| 原始数据接口文档 | [docs/others/原始数据接口文档.md](docs/others/原始数据接口文档.md) | 爬虫与数据源契约 |
| 开发联调指南 | [docs/others/开发联调指南.md](docs/others/开发联调指南.md) | 本地联调、Mock、调试 |
| 项目架构与需求清单 PRD | [docs/others/项目架构与需求清单PRD.md](docs/others/项目架构与需求清单PRD.md) | 需求与架构背景 |
| 统一运营后台需求清单 | [docs/others/统一运营后台需求清单.md](docs/others/统一运营后台需求清单.md) | 运营后台需求 |
| 数据库表设计 | [docs/others/数据库表设计.md](docs/others/数据库表设计.md) | 表结构详细说明（历史） |

### 2.3 架构决策（docs/adr/）

| 文档 | 路径 | 用途 |
|------|------|------|
| ADR 索引 | [docs/adr/README.md](docs/adr/README.md) | 架构决策记录入口 |

### 2.4 规范与变更（openspec/）

| 目录/文件 | 路径 | 用途 |
|-----------|------|------|
| 能力规范 | [openspec/specs/](openspec/specs/) | 各能力长期定义 |
| 变更记录 | [openspec/changes/](openspec/changes/) | 每次变更的设计、任务、归档 |

### 2.5 部署与脚本

| 文件/目录 | 路径 | 用途 |
|------------|------|------|
| 一键部署 | [Makefile](Makefile) | `make deploy`：commit+push + 小程序编译（如有变更）+ 远程部署 |
| 部署脚本 | [scripts/deploy.sh](scripts/deploy.sh) | 主部署流程 |
| 仅远程部署 | [scripts/deploy-remote.sh](scripts/deploy-remote.sh) | 仅 SSH + git pull + docker compose |
| 后端 Compose | [docker-compose.backend.yml](docker-compose.backend.yml) | API、scheduler、admin-frontend 容器编排 |
| 后端环境示例 | [.env.backend.example](.env.backend.example) | 环境变量模板 |
| Traefik 路由模板 | [deploy/traefik/zhaobiao-public.yml.example](deploy/traefik/zhaobiao-public.yml.example) | 公网域名转发配置 |
| 本地联调指南 | [LOCAL_INTERACTION_GUIDE.md](LOCAL_INTERACTION_GUIDE.md) | 本地 curl 测试、接口示例 |

---

## 3. 关键约定速查

- **提交代码前**：先 `git pull --rebase` 拉取最新代码，避免推送冲突。可安装 pre-push hook 自动执行：`cp scripts/git-hooks/pre-push .git/hooks/pre-push && chmod +x .git/hooks/pre-push`。
- **API 入口**：`uvicorn server.main:app`，默认 8000；健康探测 `GET /openapi.json`。
- **数据库**：SQLite，路径由 `NOTICES_DB` 指定，默认 `data/notices.db`。
- **生产部署**：100.64.0.5 运行 Docker Compose；100.64.0.7 运行 Traefik 转发至 100.64.0.5:8000、100.64.0.5:8091。
- **端口绑定**：生产必须 `API_PUBLISH_BIND=100.64.0.5:8000`，否则 Traefik 无法访问，导致 502。
- **API 单实例**：禁止 uvicorn 多 worker；禁止 api 容器多副本。

---

## 4. 更新说明

- 本文档随 `docs/` 结构变化而更新。
- 新增主文档时，同步更新 [docs/README.md](docs/README.md) 与本文档 2.1 节。
