# Design: 爬虫数据存储与 API 查询表设计

## Context

- **现状**：《原始数据接口文档》已约定网站一（三类公告）、网站二（采购意向公开、采购公告）的列表/详情接口及落库字段建议；《接口文档-前端与小程序》已约定列表/详情 API 的请求参数与响应字段（如 id、title、publishTime、sourceName、regionName、categoryNum、content 等）。爬虫与 API 实现尚未固定「数据如何存、API 查哪张表、按类型分表还是统一表」。
- **约束**：存储方案需同时满足爬虫按 (site, id) 去重落库、API 按分页与 category 筛选返回、前端字段名与类型与接口文档一致；后续可能新增站点或公告类型，表结构应可扩展。
- **干系人**：爬虫开发、API 开发、前端（消费 API）。

## Goals / Non-Goals

**Goals:**

- 确定爬虫写入的「原始」存储形态：表名、唯一键、字段集合（与《原始数据接口文档》落库建议一致）、是否保留 raw_json。
- 确定 API 查询的数据来源：直接查原始表，还是单独维护 API 查询表/视图；若直接查原始表，约定字段到《接口文档-前端与小程序》的映射方式。
- 确定多类型/多站点下的表数量与命名：一类型一表 vs 统一公告表（或按站点分两表），并说明取舍与扩展方式。
- 产出可被实现直接参照的表结构说明与映射表，便于 storage 与 API 对齐。

**Non-Goals:**

- 不规定具体 DB 产品（SQLite/PostgreSQL 等），仅约定逻辑表结构与读写边界；不实现具体建表 SQL 或迁移脚本（留待 tasks 或实现阶段）。
- 不做正文解析、金额抽取等衍生字段的存储设计；不做搜索索引、全文检索设计。

## Decisions

### 1. 原始数据与 API 查询：是否分开两张表

- **决策**：**不单独建「API 专用」物理表。** 爬虫只写一张（或按站点两张）逻辑上的「原始公告表」；列表/详情 API **直接查询该表**，通过 **VIEW 或应用层字段映射** 得到《接口文档-前端与小程序》所需的字段名与结构（如 publishTime、sourceName、categoryNum、originUrl 等）。
- **理由**：  
  - 单一份数据源，无「原始表 ↔ API 表」同步问题，也无重复存储。  
  - 前端所需字段与原始落库字段多为同义（如 webdate → publishTime、zhuanzai/author → sourceName），映射在 VIEW 或 API 层即可完成。  
  - 若未来有强需求（如 API 表做复杂聚合、缓存或脱敏），再增加物化表或缓存层。
- **备选**：原始表 + 独立 API 查询表（ETL/同步更新）→ 增加实现与一致性成本，首版不采纳。

### 2. 一类型一张表 vs 统一表

- **决策**：**采用统一公告表（单表或按站点分两表），不采用「一种类型一张表」的多表方案。**
  - **推荐**：**一张统一表 `notices`**，包含所有站点、所有类型的公告；表内用 `site`、`categorynum`（网站一）或 `notice_type`（网站二）等字段区分业务类型；唯一键为 `(site, id)`。
  - **可选**：若网站一与网站二字段差异过大、希望物理隔离，可拆成 `notices_site1`、`notices_site2` 两张表，API 查询时 UNION 或由服务层合并；表内仍按类型字段区分，而非「每类型一张表」。
- **理由**：  
  - 前端 API 为**统一列表**（/api/list，通过 category 筛选），需要跨类型分页与排序；若每类型一张表，API 需多次 UNION 且分页/总数计算复杂，扩展新类型即加表，维护成本高。  
  - 统一表 + 索引（如 site, categorynum/notice_type, publish_time）即可满足列表筛选与详情按 id 查询；可空列或 JSON 列可容纳站点/类型专属字段（如 planId、budget）。  
  - 《原始数据接口文档》中网站一与网站二落库字段有重叠（id、title、发布时间、地区、来源等），统一表可共用这些列，差异字段用 nullable 或 JSON 存。
- **备选**：每种业务类型一张表（如 site1_002001009、site2_59、site2_00101）→ 表数量随类型线性增长，API 与迁移复杂，不采纳。

### 3. 原始表字段与唯一键

- **决策**：  
  - **唯一键**：`(site, id)`。与《原始数据接口文档》及 SITE1/SITE2 逻辑一致，爬虫 upsert 以该二元组为准。  
  - **字段**：以《原始数据接口文档》各接口「落库」建议为基准，取网站一、网站二列表与详情的**并集**，形成统一表结构；站点/类型专属字段可为空或放入扩展 JSON。  
  - **公共列示例**：site, id, title, publish_time（或 webdate/notice_time 存为统一列）, source_name（zhuanzai/author）, region_code, region_name, categorynum/notice_type, linkurl/origin_url, content/summary, first_seen_at, last_seen_at；网站二可选：plan_id, budget, purchase_manner, open_tender_time, purchaser, agency 等。  
  - **raw_json**：建议保留一列（TEXT/JSONB），存原始接口响应的 JSON，便于排查与后续补采字段，不参与 API 展示。
- **理由**：并集 + 可空/JSON 可在一张表内兼容多站点多类型，同时满足爬虫落库与 API 按需取字段。

### 4. API 层与前端字段的对应方式

- **决策**：在**应用层（API 服务）**或 **VIEW** 中实现「存储列名 → 《接口文档-前端与小程序》字段名」的映射（如 webdate → publishTime、zhuanzai/author → sourceName、noticeTime → publishTime、linkurl + baseUrl → originUrl）。  
- **理由**：前端契约已定，后端只需在读取时做一次映射，无需在存储层存两套列名；若用 VIEW，可将映射固化在 DB 层，API 仅 SELECT FROM view。

## Risks / Trade-offs

- **[Trade-off] 统一表宽表**：部分列在部分类型下为空，表较宽。  
  **Accept**：可空列与索引对现代 DB 可接受；类型专属字段集中到少量列或 JSON 可控制宽度。

- **[Risk] 后续新增站点字段差异大**：若新站点字段与现有并集差异很大，统一表可能需加列或扩 JSON。  
  **Mitigation**：设计时预留扩展列或 `extra JSONB`；新增站点时评估是否仍用同一表或拆为 notices_site3。

- **[Trade-off] 不保留「API 专用表」**：无法在 DB 层做复杂聚合或脱敏。  
  **Accept**：首版以简单、无同步为主；若有需求再引入物化视图或独立 API 表。

## Migration Plan

1. **文档**：本变更的 spec（crawler-storage-schema）中固化「表名、唯一键、字段列表、与原始接口/前端接口的映射表」；design 与 spec 通过后，实现阶段按此建表与写 API 映射。
2. **实现顺序**：先建表（或迁移脚本），再实现爬虫 storage 写入，最后实现 API 读路径（含映射）；若已有原型表，按本方案做一次 schema 对齐或迁移。
3. **回滚**：仅 schema 与映射变更，无数据格式破坏时可回滚建表/迁移；若已落库，需视情况做数据迁移或保留双表过渡期。

## Open Questions

- 是否在首版即采用「按站点分两表」（notices_site1 / notices_site2）以降低单表宽度，还是坚持单表 + 可空/JSON；可结合首期数据量与查询模式在实现时定夺。
- raw_json 是否按站点/接口分列（如 raw_list_json、raw_detail_json）还是单列存最后一条原始响应；当前建议单列即可，需与排查习惯统一。
