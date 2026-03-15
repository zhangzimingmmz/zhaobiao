## ADDED Requirements

### Requirement: 列表接口支持 source 筛选
`/api/list` SHALL 接受可选 query 参数 `source`（string），映射到 notices 表 `tradingsourcevalue` 字段进行精确匹配筛选；若未传则不过滤。

#### Scenario: 传入 source 参数
- **WHEN** 请求 `/api/list?source=510100&page=1&pageSize=10`
- **THEN** 响应 `data.list` 中所有记录的 `tradingsourcevalue` 均等于 `510100`

#### Scenario: 不传 source 参数
- **WHEN** 请求 `/api/list?page=1&pageSize=10`（无 source）
- **THEN** 响应正常，不对 source 做过滤

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
