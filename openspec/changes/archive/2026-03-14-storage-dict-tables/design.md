# Design: 基础字典表与公告单表设计理由

## Context

- **现状**：docs/存储表结构说明 仅约定了一张 `notices` 表，未设计地区、采购方式、项目分类等基础字典表；也未在文档中说明「为何公告只用一张表」「多种业务类型数据结构不同如何容纳」。前端筛选依赖的选项（地区、采购方式、分类名称）目前依赖应用层写死映射或未落库。
- **约束**：不改变现有 notices 表唯一键与列表/详情 API 契约；字典表与 notices 共用同一 DB；数据来源以《原始数据接口文档》2.5（getRegionJson、getDictInfo）及网站一 categorynum 等为准。
- **干系人**：爬虫、API、前端（筛选与展示）。

## Goals / Non-Goals

**Goals:**

- 新增**地区、采购方式、项目/公告分类**的字典表设计，约定表结构、数据来源、与 notices 的关联方式，以及供前端使用的 API（如 /api/dict/regions）。
- 在文档中**固化公告单表的设计理由**：为何采用一张 notices 表而非「一种业务类型一张表」；不同业务类型字段差异如何在同一张表中容纳（可空列、raw_json、site/category_num 区分）；何时可考虑按站点拆表或按类型分表。
- 明确 notices 中 region_code、purchase_manner、category_num 与字典表的对应关系，便于列表/筛选 API 返回选项与展示名称。

**Non-Goals:**

- 不改变 notices 的 (site, id) 唯一键与现有列定义；不强制要求 notices 表增加外键约束（可仅逻辑关联）。
- 不做全文检索、复杂聚合或分析型表设计。

## Decisions

### 1. 为何公告只用一张表（设计理由文档化）

- **理由（写入《存储表结构说明》或本文档）**：
  - **统一列表 API**：前端 /api/list 需按 category 筛选、跨类型分页与排序；若「一种类型一张表」，则需多表 UNION 且 total 与分页计算复杂，每新增一种类型就加一张表，维护成本高。
  - **字段重叠**：网站一与网站二落库字段有大量重叠（id、title、发布时间、地区、来源等），统一表可共用这些列；差异字段（如 planId、budget）用可空列或 raw_json 即可容纳。
  - **扩展方式**：新增站点或类型时，在 notices 中增加 site 或 category_num 取值即可，无需改表结构；若单表过宽或站点差异极大，再考虑拆成 notices_site1/notices_site2 或按类型分表。
- **多种业务类型数据结构不一样的容纳方式**：
  - **公共列**：所有类型共用的列（site, id, title, publish_time, source_name, region_code, category_num, content 等）统一命名、可空按需。
  - **类型专属列**：仅部分类型使用的列（如 plan_id, budget, purchase_manner, open_tender_time）设为可空，非该类型行为空。
  - **raw_json**：原始接口响应的 JSON 保留在 raw_json 列，便于排查与后续补采未在表中建列的字段；不参与常规 API 展示。
  - **不采用「一类型一张表」**：避免表数量随类型线性增长、API 与迁移复杂。

### 2. 字典表种类与数据来源

- **地区（dict_region）**：数据来源为网站二 getRegionJson；字段至少含 region_code（或 id）、region_full_name、parent_id、层级/是否叶子等；用于前端地区筛选与 notices.region_code / tradingsourcevalue 的展示名称解析。
- **采购方式（dict_purchase_manner）**：数据来源为网站二 getDictInfo（dictType=xxcg-noticeType 或采购方式相关 type）；字段至少含 dict_code、dict_name；与 notices.purchase_manner 对应，供筛选与展示名称。
- **项目/公告分类（dict_notice_category）**：统一存放「业务类型编号 → 展示名称」的映射，如 002001009→招标计划、59→采购意向公开、00101→采购公告；数据来源可为爬虫拉取（若数据源有接口）、或静态配置/建表时初始化；与 notices.category_num 对应，供列表 categoryName 与筛选选项。

### 3. 字典表与 notices 的关联

- **关联方式**：notices 表不强制建外键；逻辑上 notices.region_code / tradingsourcevalue 对应 dict_region.region_code（或等价键），notices.purchase_manner 对应 dict_purchase_manner.dict_code，notices.category_num 对应 dict_notice_category.category_num（或 dict_code）。API 层在返回列表/详情或筛选选项时，可 JOIN 字典表取展示名称，或先查字典表再映射。
- **唯一键**：字典表各自定义唯一键（如 dict_region 以 region_code 为主键或唯一键；dict_purchase_manner 以 dict_code；dict_notice_category 以 category_num），保证可被 notices 引用与去重。

### 4. 字典数据更新策略

- **地区、采购方式**：可由爬虫或定时任务按需调用网站二 getRegionJson、getDictInfo 全量或增量刷新字典表；若接口不可用，可保留上次快照或静态初始化。
- **项目/公告分类**：若数据源无稳定接口，可采用静态配置（建表时 INSERT 或配置文件），与《接口文档-前端与小程序》中 category 取值保持一致。

## Risks / Trade-offs

- **[Trade-off] 字典表与数据源不同步**：若爬虫未拉取或接口变更，字典表可能陈旧。  
  **Mitigation**：约定刷新频率或人工校验；前端展示以字典表为准，缺失时回退为码值展示。

- **[Trade-off] 公告单表宽表**：部分列在部分类型下为空。  
  **Accept**：与 crawler-data-storage 设计一致；可空列与索引可接受。

## Migration Plan

1. 在 docs/存储表结构说明.md 中新增「公告单表设计理由」与「多类型结构容纳方式」小节（或引用本 design）；新增「字典表」小节，列出表名、列、与 notices 的关联。
2. 新增建表 SQL（如 002_create_dict_*.sql），按顺序执行；若有爬虫拉取字典，在拉取逻辑中写入字典表。
3. API 层新增 /api/dict/regions、/api/dict/purchase-manner、/api/dict/categories（或统一 /api/dict?type=...），从字典表读取并返回；列表/详情中的 categoryName、regionName 等可改为从字典表 JOIN 或查表映射。

## Open Questions

- 网站一 tradingsourcevalue（如 S020、S002）与网站二 regionCode（如 510001）是否共用同一张地区字典表，还是分站点两张表；若共用，需约定统一编码或映射规则。
- 采购方式与公告分类是否合并为一张「通用字典表」（dict_type + dict_code + dict_name）以减少表数量，由实现阶段定夺。
