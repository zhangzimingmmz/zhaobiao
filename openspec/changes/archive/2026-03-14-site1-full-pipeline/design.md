# Design: 网站一全链路打通

## Context

- **现状**：`crawler/storage.py` 已实现 notices 的 upsert；`crawler/migrations/` 已有 001_create_notices、002_create_dict_tables；`原始数据接口文档` 与 `接口文档-前端与小程序` 已定稿。SITE1_MODULES.md 定义了 config→client→windowing→backfill/incremental/recovery 的模块拆分，但 crawler/site1/ 下尚无实现代码；UI 使用 Mock 数据。
- **约束**：采集仅用网站一主接口 getFullTextDataNew、时间切片、三类公告；(site, id) 唯一键；不采集详情（列表已有 content 摘要）；UI 不改变路由与设计规范，仅切换数据源。
- **干系人**：开发（爬虫 + API + 前端）、后续运维（调度）。

## Goals / Non-Goals

**Goals:**

- 实现 SITE1 完整采集管线（config → client → windowing → backfill / incremental / recovery），复用现有 storage 落库，可单独运行与验收。
- 提供公告列表与详情的 REST API（/api/list、/api/detail/bid/:id），数据来自 notices 表，字段与《接口文档-前端与小程序》一致。
- 前端首页与招投标详情页接入该 API，替换 Mock，保留加载与错误态。

**Non-Goals:**

- 不实现网站二爬虫；不实现网站一详情采集（/staticJson 路径规则未约定）。
- 不在采集层做正文解析、金额/招标人抽取。
- 不改变 UI 路由、设计系统；不实现收藏/用户态持久化。

## Decisions

### 1. 爬虫存储复用

- **决策**：爬虫复用 `crawler/storage.py` 的 `upsert_records` 与 `get_connection`；表结构遵循 `full-schema-spec` 的 notices 定义；不新建 storage 模块。
- **理由**：storage 已支持 (site, id) upsert 与字段映射，避免重复实现。
- **备选**：在 site1 内实现独立 storage → 重复逻辑，不采纳。

### 2. 公告 API 形态

- **决策**：新增 FastAPI 服务，提供 GET /api/list、GET /api/detail/bid/:id；读取同一 SQLite DB；响应字段与《接口文档-前端与小程序》1.4、2.4 对齐；category 支持 002001009、002001001、002002001（网站一三类）。
- **理由**：FastAPI 轻量、易联调；与 crawler 同 repo，共享 DB 路径。
- **备选**：Flask → 等价；无后端、UI 读静态导出 → 无法分页与实时，不采纳。

### 3. 爬虫任务入口

- **决策**：backfill、incremental、recovery 各为独立 CLI 入口，如 `python -m crawler.site1.tasks.backfill --start 2026-03-01 --end 2026-03-14`；调度通过 cron 或手动触发。
- **理由**：与 SITE1_MODULES 一致；先跑通再考虑调度平台化。
- **备选**：Celery/Airflow → 首版过重，不采纳。

### 4. 前端数据源切换

- **决策**：抽象 `api/notices` 或 `hooks/useNotices` 请求列表/详情；环境变量 `VITE_API_BASE` 指定 API base URL；开发默认指向本地公告 API（如 http://localhost:8000）；Home 与 Detail 从 Mock 改为调用该层。
- **理由**：集中切换点、便于 mock 与 e2e 切换。
- **备选**：硬编码 API URL → 不利于环境切换，不采纳。

### 5. 全链路数据流

```
网站一 getFullTextDataNew
        │
        ▼
  site1/client.fetch_page
        │
        ▼
  crawler/storage.upsert_records  (site=site1_sc_ggzyjy)
        │
        ▼
  notices 表
        │
        ▼
  公告 API (FastAPI) 读取 notices
        │
        ▼
  前端 /api/list、/api/detail/bid/:id
```

## Risks / Trade-offs

- **[Risk] SQLite 写多时短暂锁**：爬虫与 API 同时访问可能短暂阻塞。  
  **Mitigation**：写批次控制、短事务；后续可迁 PostgreSQL。

- **[Risk] 首次 backfill 单日超阈值**：按天切片时某日条数 > 360 需拆窗。  
  **Mitigation**：config 中安全阈值 360，windowing 提供 split_window_to_smaller。

- **[Trade-off] 不实现 failure_q**：失败仅打日志，补偿任务通过「再次跑 48h」覆盖。  
  **Accept**：首版简化。

## Migration Plan

1. **实现顺序**：config → client → windowing → backfill → incremental → recovery → 公告 API → 前端接入。
2. **验收**：按 SITE1_MODULES 每模块验收；API 用 curl 验证；UI 本地指向 API 验证列表与详情页。
3. **回滚**：UI 保留 Mock 开关；爬虫与 API 可独立下线。

## Open Questions

- 公告 API 是否需鉴权（当前假设内网或同源，无鉴权）。
- 生产环境是否已有 PostgreSQL，若有则 storage 是否需首版支持多引擎。
