## MODIFIED Requirements

### Requirement: API 提供招投标详情接口

系统 SHALL 提供 GET /api/detail/bid/:id，按 id 查询 notices 表，返回单条招投标详情。响应字段 MUST 与《接口文档-前端与小程序》2.4 一致：id、title、categoryNum、categoryName、publishTime、projectName、budget、location、tenderer、agency、enrollStart、enrollEnd、openTime、content、originUrl。originUrl 的生成规则同列表单条（site1 用 Base+linkurl，site2 在无存储值时按 origin-url-assembly 拼装）。其中 `content` SHALL 表示面向小程序详情页渲染的正文结果，而不是数据库中的原始正文字符串。

#### Scenario: 存在 id 时返回详情

- **WHEN** 请求 GET /api/detail/bid/{id} 且该 id 存在于 notices
- **THEN** 返回 HTTP 200，单条对象包含 title、content、originUrl 等

#### Scenario: site2 招投标详情返回可用的 originUrl

- **WHEN** 请求 GET /api/detail/bid/{site2的id} 且该记录 origin_url 与 linkurl 为空
- **THEN** 返回的 data.originUrl 非空，且为可访问的详情页 URL

#### Scenario: site1 招投标详情返回结构化段落正文

- **WHEN** 请求 GET /api/detail/bid/{site1的id}
- **THEN** 返回的 data.content SHALL 是按文本结构化分段后的正文结果，而不是未分段的长文本流

#### Scenario: 不存在 id 时返回 404

- **WHEN** 请求 GET /api/detail/bid/{不存在的id}
- **THEN** 返回 HTTP 404 或 code 表示未找到

## ADDED Requirements

### Requirement: 详情接口 SHALL 依据来源站点返回不同正文渲染结果
招投标详情与信息展示详情接口 SHALL 依据 notice.site 选择正文格式化策略，确保 `site2` 保留清洗后的 HTML 语义结构，`site1` 返回可读的结构化段落内容。

#### Scenario: site2 详情保留 HTML 结构
- **WHEN** 请求 GET /api/detail/bid/{id} 或 GET /api/detail/info/{id} 且该记录来自 `site2_ccgp_sichuan`
- **THEN** 返回的 data.content SHALL 保留清洗后的段落、表格、列表、图片或链接等必要 HTML 结构，并统一为小程序友好的样式

#### Scenario: site1 详情返回文本重排结果
- **WHEN** 请求 GET /api/detail/bid/{id} 或 GET /api/detail/info/{id} 且该记录来自 `site1_sc_ggzyjy`
- **THEN** 返回的 data.content SHALL 是由文本流按编号、章节或字段边界重排后的可读正文结果

#### Scenario: 原始正文异常时返回稳定内容
- **WHEN** 详情接口遇到格式错误、脏 HTML 或无法可靠解析的正文
- **THEN** 返回的 data.content SHALL 退化为稳定可读的段落化结果或为空，而不是把损坏的原始内容直接回传给客户端
