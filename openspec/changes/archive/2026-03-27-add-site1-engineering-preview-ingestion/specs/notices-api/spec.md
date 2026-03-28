## MODIFIED Requirements

### Requirement: API 提供列表接口

系统 SHALL 提供 GET `/api/list`，支持 Query 参数：page（页码从 1）、pageSize、category（必填，支持 `002001009`、`002001010`、`002001001`、`002002001`、`59`、`00101`）、keyword、timeStart、timeEnd、regionCode、source、purchaseManner、purchaseNature、purchaser。响应 MUST 包含 `data.total`（总条数）与 `data.list`（当前页列表）。

#### Scenario: 分页列表返回正确

- **WHEN** 请求 `GET /api/list?page=1&pageSize=10&category=002001010`
- **THEN** 返回 HTTP 200，`data.list` 为最多 10 条，`data.total` 为总条数

#### Scenario: 筛选参数生效

- **WHEN** 请求 `GET /api/list?page=1&pageSize=10&category=002001010&timeStart=2026-03-01 00:00:00&timeEnd=2026-03-14 23:59:59`
- **THEN** 返回的 `list` 中 `publishTime` 在指定时间范围内

### Requirement: 列表单条字段与接口文档一致

列表 `data.list` 单条 MUST 包含：id、title、publishTime、sourceName、regionName、regionCode、categoryNum、categoryName、originUrl、summary、planId（可选）。字段命名与《接口文档-前端与小程序》1.4 一致。originUrl 的生成规则：网站一（site 含 site1）为 Base + linkurl；网站二（site 含 site2）当 origin_url 与 linkurl 均为空时，SHALL 按 origin-url-assembly 规范拼装；否则优先使用 origin_url，其次 Base + linkurl。对于 `categoryNum=002001010` 的记录，`categoryName` MUST 返回“招标文件预公示”。

#### Scenario: 列表字段完整

- **WHEN** 请求 `GET /api/list` 且存在数据
- **THEN** 单条包含 id、title、publishTime、sourceName、originUrl、summary 等字段，且类型正确

#### Scenario: site2 列表单条返回可用的 originUrl

- **WHEN** 请求 `GET /api/list` 且返回的列表中含 site2（四川省政府采购网）公告
- **THEN** 该单条的 `originUrl` 非空，且为可访问的详情页 URL

#### Scenario: 工程建设预公示返回正确分类名称

- **WHEN** 请求 `/api/list?category=002001010&page=1&pageSize=10` 且返回预公示记录
- **THEN** 每条记录的 `categoryNum` 为 `002001010`
- **AND** `categoryName` 为“招标文件预公示”

### Requirement: API 仅查询 site1 数据

本变更下 API SHALL 支持网站一（site=`site1_sc_ggzyjy`）工程建设与政府采购公告，以及网站二（site=`site2_ccgp_sichuan`）政府采购数据；其中 site1 的工程建设/采购类 `category` 筛选 MUST 至少支持 `002001009`、`002001010`、`002001001`、`002002001` 对应 `notices.category_num`。

#### Scenario: category 筛选正确

- **WHEN** 请求 `category=002001010`
- **THEN** 仅返回 `category_num` 为 `002001010` 的记录
