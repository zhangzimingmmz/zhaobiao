# crawler-storage-schema Specification Delta

## MODIFIED Requirements

### Requirement: 原始表字段与落库来源

存储表 SHALL 支持同时保留列表层与详情层原始数据。对于 `site1` 记录，`raw_json` SHOULD 采用组合结构保存 `_list` 与 `_detail`；当详情层存在时，正文列与原文链接列 SHALL 优先保存详情层值。

#### Scenario: site1 详情 HTML 可写入 content

- **WHEN** 爬虫获取到 site1 详情中的 `infoContent`
- **THEN** 表 SHALL 能将该 HTML 写入 `content`

#### Scenario: raw_json 保留列表与详情

- **WHEN** 同一条 site1 记录同时拥有列表数据和详情数据
- **THEN** `raw_json` 中同时保存 `_list` 与 `_detail`
