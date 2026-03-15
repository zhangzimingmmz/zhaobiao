# origin-url-assembly Specification

## Purpose
TBD - created by archiving change fix-origin-url-jump. Update Purpose after archive.
## Requirements
### Requirement: site2 公告的 originUrl 拼装规则

当 notices 表中记录的 origin_url 与 linkurl 均为空，且 site 包含 `site2` 时，系统 SHALL 按以下规则拼装 originUrl：

- Base: `https://www.ccgp-sichuan.gov.cn`
- Path: `/maincms-web/article`
- Query: `type=notice&id={id}&planId` 或 `type=notice&id={id}&planId={plan_id}`（当 plan_id 非空时）

完整 URL 示例：`https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id=f35403f3-b6f1-4b79-95f0-5aeee0f699c5&planId=8a69c9719ca6d760019ca786a48000fb`

#### Scenario: site2 有 plan_id 时拼装完整 URL

- **WHEN** 记录 site 含 site2、origin_url 与 linkurl 为空、plan_id 非空
- **THEN** originUrl 为 `https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id={id}&planId={plan_id}`

#### Scenario: site2 无 plan_id 时拼装 URL

- **WHEN** 记录 site 含 site2、origin_url 与 linkurl 为空、plan_id 为空
- **THEN** originUrl 为 `https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id={id}&planId`（planId 参数存在但无值）

#### Scenario: 已有 origin_url 或 linkurl 时不覆盖

- **WHEN** 记录存在非空的 origin_url 或 linkurl
- **THEN** 使用已有逻辑（Base + linkurl 或 origin_url），不执行 site2 拼装

