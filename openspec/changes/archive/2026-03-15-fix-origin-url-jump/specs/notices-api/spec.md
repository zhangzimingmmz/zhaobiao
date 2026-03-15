# Spec: notices-api (delta)

## MODIFIED Requirements

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

## ADDED Requirements

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
