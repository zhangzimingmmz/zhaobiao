# notices-api Specification Delta

## MODIFIED Requirements

### Requirement: API 提供招投标详情接口

系统 SHALL 提供 GET /api/detail/bid/:id，按 id 查询 notices 表，返回单条招投标详情。对 `site1_sc_ggzyjy` 记录，若 notices.content 保存的是详情层 `infoContent` HTML，则接口 MUST 直接返回该正文，并优先返回 notices.origin_url 中的详情原文链接。

#### Scenario: site1 详情返回详情层 HTML 正文

- **WHEN** 请求 GET /api/detail/bid/{site1的id} 且该记录已补齐详情层数据
- **THEN** 返回的 data.content 为详情层 HTML 渲染结果，而不是列表压平文本

#### Scenario: site1 详情返回原站 originUrl

- **WHEN** 请求 GET /api/detail/bid/{site1的id} 且该记录详情响应中存在 `originurl`
- **THEN** 返回的 data.originUrl 优先为该原站链接
