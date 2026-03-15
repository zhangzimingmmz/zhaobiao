# Spec: notices-data-api

## ADDED Requirements

### Requirement: 公告列表查询

系统 SHALL 提供公告列表查询接口，支持分页（如 page、pageSize）及可选的按 categorynum、时间范围、tradingsourcevalue 筛选；响应 SHALL 包含当前页条目列表与总条数（或可推导总页数）；单条字段 SHALL 与 UI 侧 BidListItem / DATA_STRUCTURE 约定一致（至少含 id、title、categorynum、webdate、zhuanzai、tradingsourcevalue、linkurl 等）。

#### Scenario: 分页返回一页数据

- **WHEN** 请求列表接口并传入 page=1、pageSize=10
- **THEN** 返回最多 10 条记录及总条数（或 hasMore），且每条包含 id、title、categorynum、webdate、zhuanzai、tradingsourcevalue、linkurl

#### Scenario: 按分类筛选

- **WHEN** 请求列表时传入 categorynum=002001001
- **THEN** 返回结果中仅包含该 categorynum 的公告

#### Scenario: 按时间范围筛选

- **WHEN** 请求列表时传入 startTime、endTime（或等效参数）
- **THEN** 返回结果中 webdate 落在该区间内

---

### Requirement: 公告详情查询

系统 SHALL 提供按公告 id（或 site+id）查询单条详情的接口；响应 SHALL 包含 SITE1 落库的完整展示用字段，与 UI 侧 BidDetailItem / DATA_STRUCTURE 一致（含 content、titlenew 等可选字段）；若 id 不存在 SHALL 返回 404 或等效语义。

#### Scenario: 存在则返回详情

- **WHEN** 请求详情接口并传入有效 id
- **THEN** 返回单条公告的完整展示字段，包含 content、title、webdate、linkurl 等

#### Scenario: 不存在返回 404

- **WHEN** 请求详情接口并传入不存在的 id
- **THEN** 返回 HTTP 404 或 { error: "not_found" } 等明确语义

---

### Requirement: 数据来源与一致性

列表与详情接口的数据来源 SHALL 为 SITE1 爬虫落库结果；字段名与类型 SHALL 与 crawler 存储约定及 ui/guidelines/DATA_STRUCTURE.md 对齐，以便前端无需二次映射即可使用。

#### Scenario: 字段与 UI 契约一致

- **WHEN** 前端请求列表或详情
- **THEN** 响应字段可直接映射到 BidListItem / BidDetailItem，无需在 UI 层做字段重命名或类型转换（除日期格式化等展示层逻辑）
