# notices-api Specification

## Purpose
定义公告列表与详情接口的查询范围、字段映射、筛选规则与返回约束，确保后端查询能力和前端约定字段在实现与文档层面保持一致。
## Requirements
### Requirement: API 提供列表接口

系统 SHALL 提供 GET /api/list，支持 Query 参数：page（页码从 1）、pageSize、category（必填，支持 002001009、002001001、002002001）、keyword、timeStart、timeEnd、regionCode、source。响应 MUST 包含 data.total（总条数）与 data.list（当前页列表）。

#### Scenario: 分页列表返回正确

- **WHEN** 请求 GET /api/list?page=1&pageSize=10&category=002001009
- **THEN** 返回 HTTP 200，data.list 为最多 10 条，data.total 为总条数

#### Scenario: 筛选参数生效

- **WHEN** 请求 GET /api/list?page=1&pageSize=10&category=002001009&timeStart=2026-03-01 00:00:00&timeEnd=2026-03-14 23:59:59
- **THEN** 返回的 list 中 publishTime 在指定时间范围内

### Requirement: 列表单条字段与接口文档一致

列表 data.list 单条 MUST 包含：id、title、publishTime、sourceName、regionName、regionCode、categoryNum、categoryName、originUrl、summary、planId（可选）。字段命名与《接口文档-前端与小程序》1.4 一致。originUrl 的生成规则：网站一（site 含 site1）为 Base + linkurl；网站二（site 含 site2）当 origin_url 与 linkurl 均为空时，SHALL 按 origin-url-assembly 规范拼装；否则优先使用 origin_url，其次 Base + linkurl。

#### Scenario: 列表字段完整

- **WHEN** 请求 GET /api/list 且存在数据
- **THEN** 单条包含 id、title、publishTime、sourceName、originUrl、summary 等字段，且类型正确

#### Scenario: site2 列表单条返回可用的 originUrl

- **WHEN** 请求 GET /api/list 且返回的列表中含 site2（四川省政府采购网）公告
- **THEN** 该单条的 originUrl 非空，且为可访问的详情页 URL

### Requirement: API 提供招投标详情接口

系统 SHALL 提供 GET /api/detail/bid/:id，按 id 查询 notices 表，返回单条招投标详情。响应字段 MUST 与《接口文档-前端与小程序》2.4 一致：id、title、categoryNum、categoryName、publishTime、projectName、budget、location、tenderer、agency、enrollStart、enrollEnd、openTime、content、originUrl。originUrl 的生成规则同列表单条（site1 用 Base+linkurl，site2 在无存储值时按 origin-url-assembly 拼装）。

#### Scenario: 存在 id 时返回详情

- **WHEN** 请求 GET /api/detail/bid/{id} 且该 id 存在于 notices
- **THEN** 返回 HTTP 200，单条对象包含 title、content、originUrl 等

#### Scenario: site2 招投标详情返回可用的 originUrl

- **WHEN** 请求 GET /api/detail/bid/{site2的id} 且该记录 origin_url 与 linkurl 为空
- **THEN** 返回的 data.originUrl 非空，且为可访问的详情页 URL

#### Scenario: 不存在 id 时返回 404

- **WHEN** 请求 GET /api/detail/bid/{不存在的id}
- **THEN** 返回 HTTP 404 或 code 表示未找到

### Requirement: API 仅查询 site1 数据

本变更下 API SHALL 仅需支持网站一（site=site1_sc_ggzyjy）数据；category 筛选 002001009、002001001、002002001 对应 notices.category_num。

#### Scenario: category 筛选正确

- **WHEN** 请求 category=002001001
- **THEN** 仅返回 category_num 为 002001001 的记录

### Requirement: 列表接口支持 purchaseManner 筛选

`/api/list` SHALL 接受可选 query 参数 `purchaseManner`（string），映射到 notices 表对应字段进行精确匹配；若未传则不过滤。

#### Scenario: 传入 purchaseManner 参数

- **WHEN** 请求 `/api/list?purchaseManner=1&page=1&pageSize=10`
- **THEN** 响应列表中只返回采购方式为 `1`（公开招标）的记录

#### Scenario: purchaseManner 无匹配结果

- **WHEN** 传入数据库中不存在的 purchaseManner 值
- **THEN** 响应 `data.total` 为 0，`data.list` 为空数组，HTTP 200

### Requirement: 列表接口支持 purchaser 关键词筛选

`/api/list` SHALL 接受可选 query 参数 `purchaser`（string），对采购人字段做模糊匹配（LIKE）；若未传则不过滤。

#### Scenario: 传入 purchaser 参数

- **WHEN** 请求 `/api/list?purchaser=成都市&page=1&pageSize=10`
- **THEN** 响应列表中记录的采购人字段包含「成都市」

#### Scenario: purchaser 参数与 keyword 可同时使用

- **WHEN** 同时传入 `purchaser` 和 `keyword`
- **THEN** 两个条件均生效（AND 关系），结果同时满足两个筛选条件

### Requirement: 列表接口支持 purchaseNature 筛选

`/api/list` SHALL 接受可选 query 参数 `purchaseNature`（string），映射到 notices 表 `purchase_nature` 列进行精确匹配；若未传则不过滤。详见 `purchase-nature-filter` spec。

#### Scenario: 传入 purchaseNature 参数

- **WHEN** 请求 `/api/list?purchaseNature=1&category=00101&page=1&pageSize=10`
- **THEN** 响应列表中只返回 purchase_nature 为 `1` 的记录

### Requirement: S-code 与行政区划映射基于实际数据

regionCode、source 筛选使用的 S-code↔行政区划映射 SHALL 与 site1 实际 `source_name` 对应关系一致，而非仅依据文档。映射表 SHALL 使「选广安」返回广安数据、「选遂宁」返回遂宁数据。

#### Scenario: 广安筛选正确

- **WHEN** 请求 `/api/list?regionCode=511600&category=002001001` 或 `source=511600`
- **THEN** 返回 tradingsourcevalue=S015（广安市公共资源中心）的记录

#### Scenario: 遂宁筛选正确

- **WHEN** 请求 `/api/list?regionCode=510900&category=002001001` 或 `source=510900`
- **THEN** 返回 tradingsourcevalue=S014（遂宁市公共资源交易服务中心）的记录

### Requirement: API 提供信息展示详情接口且 originUrl 可拼装

系统 SHALL 提供 GET /api/detail/info/:id，返回单条信息展示详情。响应 MUST 包含 originUrl。当 origin_url 与 linkurl 均为空且 site 含 site2 时，SHALL 按 origin-url-assembly 规则拼装 originUrl。

#### Scenario: site2 信息详情返回可用的 originUrl

- **WHEN** 请求 GET /api/detail/info/{site2的id} 且该记录 origin_url 与 linkurl 为空
- **THEN** 返回的 data.originUrl 非空，且为可访问的详情页 URL

### Requirement: 详情接口 SHALL 返回来源站点名称

招投标详情与信息详情接口的响应 SHALL 包含可选字段 sourceSiteName（string），表示数据来源站点的人类可读名称，供前端在无 originUrl 时展示兜底文案。site1 对应「四川省公共资源交易平台」，site2 对应「四川省政府采购网」。

#### Scenario: 详情响应包含 sourceSiteName

- **WHEN** 请求 GET /api/detail/bid/{id} 或 GET /api/detail/info/{id} 且记录存在
- **THEN** 返回的 data 包含 sourceSiteName 字段

