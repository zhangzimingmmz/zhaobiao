# Design: SITE1 爬虫与 UI 一体化

## Context

- **现状**：`crawler/` 下仅有 SITE1/SITE2 的逻辑文档与模块拆分（SITE1_MODULES.md），无代码；`ui/` 为 React + Vite 前端，已有首页、详情、筛选、设计系统与 Mock 数据，数据结构与 SITE1 API 字段已对齐（DATA_STRUCTURE.md）。
- **约束**：采集仅用 SITE1 主接口、时间切片、三类公告；(site, id) 唯一键；不依赖回退接口、不做正文推导；UI 不改变现有页面与设计规范，仅切换数据源。
- **干系人**：开发（爬虫 + 前端）、后续运维（调度与监控）。

## Goals / Non-Goals

**Goals:**

- 实现 SITE1 完整采集管线（config → client → storage → windowing → backfill / incremental / recovery），可单独运行与验收。
- 提供公告列表与详情的稳定查询能力，供 UI 消费，字段与现有 BidListItem / BidDetailItem 兼容。
- 前端首页与详情页接入该查询能力，替换 Mock，保留加载与错误态。

**Non-Goals:**

- 不实现网站二（SITE2）爬虫；不实现验证码/签名等 SITE2 依赖。
- 不在采集层做正文解析、金额/招标人抽取；不做详情页 HTML 二次抓取（可后续阶段再做）。
- 不改变 UI 路由、设计系统与页面信息架构；不在此变更内实现收藏/用户态的持久化（若当前为前端仅状态）。

## Decisions

### 1. 爬虫与存储技术选型

- **决策**：爬虫使用 Python 3，存储首选 SQLite（单文件、零运维），表结构仅包含 SITE1_CRAWLER_LOGIC 中「建议保留字段」+ first_seen_at / last_seen_at；若项目已有 PostgreSQL/MySQL，可增加适配层，接口不变。
- **理由**：SITE1 无验证码，Python + requests 即可；SQLite 便于本地与单机部署，后续可迁库而不改模块接口。
- **备选**：直接用 PostgreSQL → 增加部署与连接管理，首版不采纳。

### 2. 公告数据对前端的暴露方式

- **决策**：增加一层「公告 API」：REST 或 BFF。列表 GET 支持分页（page/pageSize）与可选筛选（categorynum、时间范围、tradingsourcevalue）；详情 GET 按 id（或 site+id）返回单条。响应字段与 ui/guidelines/DATA_STRUCTURE.md 及 BidListItem/BidDetailItem 一致。
- **理由**：UI 已按该结构开发，接口对齐可最小化前端改动；列表/详情分离便于缓存与按需加载。
- **备选**：前端直连 DB → 仅适合同机、且暴露 DB 结构，不采纳。

### 3. API 服务形态

- **决策**：优先采用「轻量 HTTP 服务」承载公告 API（如 FastAPI/Flask），与爬虫同 repo 或同部署单元；读取同一 DB。开发阶段可与 UI 同机，通过 Vite proxy 或 CORS 访问。
- **理由**：实现简单、易于本地联调；后续可拆成独立服务或合并进现有后端。
- **备选**：无后端、UI 读静态 JSON 导出 → 无法支持实时数据与分页，不采纳。

### 4. 爬虫任务调度

- **决策**：backfill 通过 CLI 手动或一次性脚本触发；incremental 与 recovery 通过 cron 或系统定时任务（如 00:05, 02:05, … 每 2 小时增量；每日一次 48 小时补偿）。不在本变更内引入 Celery/Kafka 等重型队列。
- **理由**：与 SITE1_CRAWLER_LOGIC 一致；先跑通再考虑调度平台化。

### 5. 前端数据源切换方式

- **决策**：在 UI 中抽象「数据源」：如 `api/notices.ts`（或 hooks）请求列表/详情；Home 与 Detail 从 Mock 改为调用该层；环境变量或配置指定 API base URL，默认开发指向本地公告 API。
- **理由**：集中切换点、便于 mock 与 e2e 切换；不破坏现有组件 props 与设计系统。

## Risks / Trade-offs

- **[Risk] 单库同时写（爬虫）与读（API）**：SQLite 写多时可能短暂锁。  
  **Mitigation**：写批次控制、短事务；若后续量上来可迁 PostgreSQL 或读写分离。

- **[Risk] 首次 backfill 历史窗口过大**：若起点很早，按天切片仍可能单日超阈值。  
  **Mitigation**：config 中安全阈值 360、拆窗逻辑已设计；backfill 建议先短范围验收再扩大。

- **[Trade-off] 不实现 failure_q 持久化**：失败仅打日志，补偿任务通过「再次跑 48h」覆盖。  
  **Accept**：首版简化；后续可加失败队列与重试表。

## Migration Plan

1. **实现顺序**：config → client → storage → windowing → backfill → incremental → recovery；随后实现公告 API；最后 UI 接入 API 并关闭 Mock。
2. **验收**：按 SITE1_MODULES 每模块验收；API 用 curl/Postman 验证列表与详情；UI 本地指向本地 API 验证列表与详情页。
3. **回滚**：UI 保留 Mock 开关或分支，可随时切回静态数据；爬虫与 API 可独立下线不影响前端展示旧数据。

## Open Questions

- 生产环境是否已有统一 DB（如 PostgreSQL），若有则 storage 是否需首版即支持多引擎。
- 公告 API 是否需鉴权（当前假设内网或同源，无鉴权）。
