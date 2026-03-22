# notices-api Specification

## MODIFIED Requirements

### Requirement: API 提供列表接口

系统 SHALL 提供 GET /api/list，支持 Query 参数：page（页码从 1）、pageSize、category（必填，支持 002001009、002001001、002002001）、keyword、timeStart、timeEnd、regionCode、source。响应 MUST 包含 data.total（总条数）与 data.list（当前页列表）。

列表与详情接口只对当前仍在 notices retention 保留窗口内的记录提供查询结果；已被 retention 删除的历史 notices 不再返回。

#### Scenario: 分页列表返回正确

- **WHEN** 请求 GET /api/list?page=1&pageSize=10&category=002001009
- **THEN** 返回 HTTP 200，data.list 为最多 10 条，data.total 为总条数

#### Scenario: 已过 retention 的公告不再出现在列表中

- **WHEN** 某条 notices 因超过 30 天保留窗口已被 retention 删除
- **THEN** 后续 GET /api/list 不再返回该记录

### Requirement: API 提供招投标详情接口

系统 SHALL 提供 GET /api/detail/bid/:id，按 id 查询 notices 表，返回单条招投标详情。响应字段 MUST 与《接口文档-前端与小程序》2.4 一致：id、title、categoryNum、categoryName、publishTime、projectName、budget、location、tenderer、agency、enrollStart、enrollEnd、openTime、content、originUrl。

详情接口只对 retention 窗口内仍存在的 notices 提供结果；已被 retention 删除的历史 notices SHALL 返回未找到。

#### Scenario: 存在 id 时返回详情

- **WHEN** 请求 GET /api/detail/bid/{id} 且该 id 对应的 notices 仍存在
- **THEN** 返回 HTTP 200，单条对象包含 title、content、originUrl 等

#### Scenario: 已过 retention 的详情返回未找到

- **WHEN** 请求 GET /api/detail/bid/{id} 且该 notices 已被 retention 删除
- **THEN** 返回 HTTP 404 或 code 表示未找到
