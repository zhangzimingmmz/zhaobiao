# Spec: notices-api

## ADDED Requirements

### Requirement: API 提供列表接口

系统 SHALL 提供 GET /api/list，支持 Query 参数：page（页码从 1）、pageSize、category（必填，支持 002001009、002001001、002002001）、keyword、timeStart、timeEnd、regionCode、source。响应 MUST 包含 data.total（总条数）与 data.list（当前页列表）。

#### Scenario: 分页列表返回正确

- **WHEN** 请求 GET /api/list?page=1&pageSize=10&category=002001009
- **THEN** 返回 HTTP 200，data.list 为最多 10 条，data.total 为总条数

#### Scenario: 筛选参数生效

- **WHEN** 请求 GET /api/list?page=1&pageSize=10&category=002001009&timeStart=2026-03-01 00:00:00&timeEnd=2026-03-14 23:59:59
- **THEN** 返回的 list 中 publishTime 在指定时间范围内

### Requirement: 列表单条字段与接口文档一致

列表 data.list 单条 MUST 包含：id、title、publishTime、sourceName、regionName、regionCode、categoryNum、categoryName、originUrl、summary、planId（可选）。字段命名与《接口文档-前端与小程序》1.4 一致；originUrl 对网站一为 Base + linkurl。

#### Scenario: 列表字段完整

- **WHEN** 请求 GET /api/list 且存在数据
- **THEN** 单条包含 id、title、publishTime、sourceName、originUrl、summary 等字段，且类型正确

### Requirement: API 提供招投标详情接口

系统 SHALL 提供 GET /api/detail/bid/:id，按 id 查询 notices 表，返回单条招投标详情。响应字段 MUST 与《接口文档-前端与小程序》2.4 一致：id、title、categoryNum、categoryName、publishTime、projectName、budget、location、tenderer、agency、enrollStart、enrollEnd、openTime、content、originUrl。

#### Scenario: 存在 id 时返回详情

- **WHEN** 请求 GET /api/detail/bid/{id} 且该 id 存在于 notices
- **THEN** 返回 HTTP 200，单条对象包含 title、content、originUrl 等

#### Scenario: 不存在 id 时返回 404

- **WHEN** 请求 GET /api/detail/bid/{不存在的id}
- **THEN** 返回 HTTP 404 或 code 表示未找到

### Requirement: API 仅查询 site1 数据

本变更下 API 仅需支持网站一（site=site1_sc_ggzyjy）数据；category 筛选 002001009、002001001、002002001 对应 notices.category_num。

#### Scenario: category 筛选正确

- **WHEN** 请求 category=002001001
- **THEN** 仅返回 category_num 为 002001001 的记录
