# Spec: notices-api (delta)

## ADDED Requirements

### Requirement: regionCode 与 source 跨 site 筛选

`/api/list` 的 regionCode、source 参数 SHALL 支持跨 site1、site2 的筛选。传入市级行政区划代码（510100 等）时，site2 使用 region_code 前缀匹配，site1 使用 tradingsourcevalue↔行政区划映射。详见 `list-filter-region-source-mapping` spec。

#### Scenario: regionCode 对 site2 生效

- **WHEN** 请求 `/api/list?regionCode=510100&category=00101&page=1&pageSize=10`
- **THEN** 返回 region_code 以 5101 开头的 site2 记录（若有）

#### Scenario: source 对 site1 生效

- **WHEN** 请求 `/api/list?source=S020&category=002001009` 或等价行政区划代码
- **THEN** 返回 tradingsourcevalue=S020 的 site1 记录（若有）

### Requirement: keyword 特殊字符转义

`/api/list` 的 keyword 参数在用于 LIKE 查询时 SHALL 对 `%`、`_`、`\` 进行转义，避免用户输入导致全表匹配或异常行为。

#### Scenario: keyword 含百分号

- **WHEN** 请求 `/api/list?keyword=%&category=00101`
- **THEN** 将 `%` 转义后作为字面量匹配，不导致全表返回

#### Scenario: keyword 正常文本

- **WHEN** 请求 `/api/list?keyword=招标&category=00101`
- **THEN** 行为与转义前一致，返回 title/content/description 含「招标」的记录

### Requirement: category 未传时的行为

`/api/list` 的 category 参数 SHALL 为必填。若未传或为空，系统 SHALL 返回 400 或 data.total=0、data.list=[]，并在接口文档中明确。

#### Scenario: 未传 category

- **WHEN** 请求 `/api/list?page=1&pageSize=10` 且未传 category
- **THEN** 返回 400 或空结果，不进行全表扫描

## MODIFIED Requirements

### Requirement: API 提供列表接口

系统 SHALL 提供 GET /api/list，支持 Query 参数：page（页码从 1）、pageSize、category（必填，支持 002001009、002001001、002002001、00101、59 等）、keyword、timeStart、timeEnd、regionCode、source、purchaseManner、purchaser。响应 MUST 包含 data.total（总条数）与 data.list（当前页列表）。regionCode、source 的筛选语义见 `list-filter-region-source-mapping`；keyword 需对 LIKE 特殊字符转义。

#### Scenario: 分页列表返回正确

- **WHEN** 请求 GET /api/list?page=1&pageSize=10&category=002001009
- **THEN** 返回 HTTP 200，data.list 为最多 10 条，data.total 为总条数

#### Scenario: 筛选参数生效

- **WHEN** 请求 GET /api/list?page=1&pageSize=10&category=002001009&timeStart=2026-03-01 00:00:00&timeEnd=2026-03-14 23:59:59
- **THEN** 返回的 list 中 publishTime 在指定时间范围内
