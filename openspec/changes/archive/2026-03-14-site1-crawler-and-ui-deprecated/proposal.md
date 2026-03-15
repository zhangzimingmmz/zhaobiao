# Proposal: SITE1 爬虫与 UI 一体化方案

## Why

项目已有招投标信息平台的 UI 设计（首页列表、详情页、筛选与导航）和 Mock 数据，同时已明确网站一（四川省公共资源交易网）的采集逻辑与可执行模块拆分（SITE1_MODULES.md）。当前缺少：1）可运行的 SITE1 采集管线，将公告数据稳定落库；2）UI 与真实数据源的对接。本变更在「只做稳定原始数据采集、不做正文推导」的前提下，实现 SITE1 全链路采集并将现有 UI 接入真实数据，形成从采集到展示的完整闭环。

## What Changes

- **新增 SITE1 爬虫实现**：按 SITE1_MODULES.md 与 SITE1_CRAWLER_LOGIC.md 实现 config、client、storage、windowing、backfill、incremental、recovery 共 7 个模块，仅采集三类公告（招标计划 002001009、招标公告 002001001、政府采购采购公告 002002001），使用主接口与时间切片策略，以 (site, id) 去重落库。
- **新增公告数据访问层**：提供列表与详情查询接口（或可被 UI 直接消费的数据契约），数据来源为 SITE1 爬虫落库结果，字段与现有 UI 数据结构（DATA_STRUCTURE.md）对齐。
- **UI 接入真实数据**：首页列表与详情页由当前 Mock 数据切换为上述数据访问层；保留现有设计系统与页面结构，仅替换数据源与必要的数据映射/加载状态。

无破坏性变更：UI 现有路由与组件结构不变，仅数据来源从静态 Mock 改为动态接口。

## Capabilities

### New Capabilities

- `site1-crawler`: 网站一采集管线。包含配置、主接口请求与重试、去重落库、时间窗口计算、初始化/增量/补偿三类任务，产出可被查询的公告原始数据。
- `notices-data-api`: 公告列表与详情查询能力。对 UI 暴露列表（分页/筛选）与详情（按 id）的稳定接口或数据契约，数据来自 SITE1 落库结果，字段满足 UI 展示与路由需求。
- `ui-data-binding`: 前端数据绑定。首页与详情页从 Mock 切换为调用公告数据接口，处理加载与错误状态，保持现有设计规范与交互。

### Modified Capabilities

- （无。本次为新增能力与数据源切换，不修改既有功能的需求定义。）

## Impact

- **代码**：新增 `crawler/site1/` 下各模块及 `site1/tasks/` 下任务入口；新增或扩展现有后端/服务层以提供公告查询 API；`ui/` 下首页与详情页的数据获取逻辑与类型定义需对接新接口。
- **依赖**：爬虫侧需 HTTP 客户端与存储（如 SQLite/PostgreSQL/现有 DB）；若采用独立服务，需约定 API 契约与部署方式。
- **运行**：需部署或调度 SITE1 的 backfill / incremental / recovery 任务；UI 需能访问公告查询端点（同源或配置 CORS/代理）。
