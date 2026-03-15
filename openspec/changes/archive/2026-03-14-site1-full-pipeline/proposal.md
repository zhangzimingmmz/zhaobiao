# Proposal: 网站一全链路打通

## Why

项目已有《原始数据接口文档》约定的网站一接口契约、`crawler/storage.py` 落库能力、`docs/存储表结构说明.md` 与 `full-schema-spec` 的表设计，以及 SITE1_MODULES.md 的模块拆分。site1-crawler-and-ui 变更已定义设计但尚未落地实现。当前需要一份可执行的实施计划，将「爬虫采集 → 存储落库 → API 查询 → 前端展示」全链路打通，形成从数据源到用户可见的完整闭环。

## What Changes

- **实现 SITE1 爬虫管线**：按 SITE1_MODULES.md 实现 config、client、windowing、backfill、incremental、recovery；复用现有 `crawler/storage.py` 落库；仅采集三类公告（招标计划 002001009、招标公告 002001001、政府采购采购公告 002002001），以 (site, id) 去重。
- **新增公告 API 服务**：提供 GET /api/list（分页、筛选）与 GET /api/detail/bid/:id，数据来自 notices 表，字段与《接口文档-前端与小程序》对齐。
- **前端接入真实数据**：首页列表与招投标详情页从 Mock 切换为调用公告 API；保留现有设计系统与路由，仅替换数据源并处理加载/错误态。

无破坏性变更：UI 路由与组件结构不变，仅数据来源从静态 Mock 改为动态接口。

## Capabilities

### New Capabilities

- `site1-crawler`: 网站一采集管线。包含 config、client、windowing、backfill/incremental/recovery 任务，产出可被查询的公告数据并写入 notices 表。
- `notices-api`: 公告列表与详情查询 API。对前端暴露 /api/list、/api/detail/bid/:id，数据来自 notices 表，字段与接口文档一致。
- `ui-api-binding`: 前端数据绑定。首页与详情页从 Mock 切换为调用公告 API，处理加载与错误状态。

### Modified Capabilities

- （无。本次为新增能力与数据源切换，不修改既有功能的需求定义。）

## Impact

- **代码**：新增 `crawler/site1/` 下 config、client、windowing 及 tasks/ 下 backfill、incremental、recovery；新增公告 API 服务（如 FastAPI）；`ui/` 下首页与详情页的数据获取逻辑需对接新接口。
- **依赖**：爬虫侧需 requests；API 侧需 FastAPI/Flask；存储复用现有 SQLite 与 migrations。
- **运行**：需调度 backfill（初始化）、incremental（每 2h）、recovery（每日 48h 补偿）；UI 需能访问公告 API（Vite proxy 或 CORS）。
