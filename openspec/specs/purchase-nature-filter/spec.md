# purchase-nature-filter Specification

## Purpose
TBD - created by archiving change fix-data-and-filter-pipeline. Update Purpose after archive.
## Requirements
### Requirement: 采购性质落库

notices 表 SHALL 包含 `purchase_nature` 列（TEXT，可空）。site2 爬虫在写入采购公告（category_num=00101）时 SHALL 从 API 响应的 `purchaseNature` 字段映射并写入。

#### Scenario: site2 采购公告写入 purchase_nature

- **WHEN** site2 爬虫抓取采购公告列表/详情且 API 返回 purchaseNature（如 "1"、"2"、"3"）
- **THEN** 落库时 purchase_nature 列 SHALL 写入该值

#### Scenario: 历史数据无 purchase_nature

- **WHEN** 记录在增加 purchase_nature 列之前已存在
- **THEN** 该列可为 NULL，不影响现有查询

### Requirement: 列表接口支持 purchaseNature 筛选

`/api/list` SHALL 接受可选 query 参数 `purchaseNature`（string），映射到 notices 表 `purchase_nature` 列进行精确匹配；若未传则不过滤。

#### Scenario: 传入 purchaseNature 参数

- **WHEN** 请求 `/api/list?purchaseNature=1&category=00101&page=1&pageSize=10`
- **THEN** 响应列表中只返回 purchase_nature 为 `1`（货物）的记录

#### Scenario: purchaseNature 无匹配结果

- **WHEN** 传入数据库中不存在的 purchaseNature 值
- **THEN** 响应 `data.total` 为 0，`data.list` 为空数组，HTTP 200

### Requirement: 前端传递采购性质筛选

`index.tsx` 的 buildParams SHALL 将 `filterValues.nature?.code` 作为 `purchaseNature` 参数传给 `api.list()`。

#### Scenario: 选择采购性质后 API 调用携带 purchaseNature

- **WHEN** 用户在 FilterSheet 的「采购性质」中选择「货物」并确认
- **THEN** `api.list()` 参数中包含 `purchaseNature: '1'`

