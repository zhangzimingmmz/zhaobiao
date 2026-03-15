# Proposal: 基础字典表与公告表设计理由补充

## Why

当前《存储表结构说明》仅约定了一张公告表 `notices`，未单独设计**地区、采购方式、项目分类**等基础字典表，也未在文档中说明：为何公告采用单表、多种业务类型的数据结构差异如何在同一张表中容纳。这导致（1）前端筛选（地区、采购方式、分类）依赖的选项数据无统一落库与接口约定；（2）对「一种类型一张表」与「一张公告表」的取舍缺少可追溯的设计理由。本变更在保留现有 `notices` 单表设计的前提下，**新增字典表设计**，并**在文档中固化公告单表的理由与多类型结构差异的容纳方式**，便于后续扩展与答疑。

## What Changes

- **新增基础字典表设计**：为**地区**（如网站二 getRegionJson）、**采购方式**（如网站二 getDictInfo dictType=xxcg-noticeType）、**项目/公告分类**（网站一 categorynum、网站二 noticeType 等）定义独立表结构，约定数据来源（爬虫拉取或静态配置）、唯一键与 API 暴露方式（如 /api/dict/regions、/api/dict/purchase-manner）。
- **文档化公告单表理由**：在 design 或存储说明中明确写出「为何用一张 notices 表而非一类型一张表」、「不同业务类型字段差异如何通过可空列与 raw_json 容纳」、以及「何时可考虑拆成 notices_site1/notices_site2 或按类型分表」。
- **约定字典与 notices 的关联方式**：notices 表中的 region_code、purchase_manner、category_num 等与字典表的外键或码值对应关系，以及列表/筛选 API 如何消费字典（下拉选项、校验、展示名称）。

无破坏性变更：现有 `notices` 表与列表/详情 API 契约不变；字典表为新增，API 可新增 /api/dict/* 或在现有接口中引用字典数据。

## Capabilities

### New Capabilities

- **storage-dict-tables**：基础字典表（地区、采购方式、项目/公告分类）的表结构、数据来源（爬虫接口或配置）、唯一键与索引；与 notices 的关联方式（如 notices.region_code 对应 dict_region.region_code）；供前端筛选与展示的 API（如 GET /api/dict/regions）的契约与数据来源。

### Modified Capabilities

- （无。crawler-storage-schema 仍要求统一公告表与 (site, id)；本变更仅新增字典表及设计理由文档，不修改公告表必须单表的 requirement。）

## Impact

- **文档**：在 docs/存储表结构说明.md 或 design 中新增「公告单表设计理由」与「多类型结构容纳方式」章节；新增字典表结构说明（表名、列、来源）。
- **实现**：新增字典表建表 SQL（如 crawler/migrations/002_create_dict_*.sql）；爬虫或定时任务可拉取网站二 getRegionJson、getDictInfo 写入字典表；API 层新增 /api/dict/regions、/api/dict/purchase-manner 等（或合并为 /api/dict?type=regions|purchase-manner）。
- **依赖**：无新增运行时依赖；字典表与 notices 共用同一 DB。
