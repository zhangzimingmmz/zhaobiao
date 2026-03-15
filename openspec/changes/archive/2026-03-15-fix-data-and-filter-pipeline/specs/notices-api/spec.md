# Spec: notices-api (delta)

## ADDED Requirements

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
