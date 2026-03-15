# Spec: list-filter-region-source-mapping

## ADDED Requirements

### Requirement: regionCode 按市级行政区划筛选

`/api/list` 的 regionCode 参数 SHALL 接受市级行政区划代码（如 510100=成都市），并跨 site1、site2 正确筛选。site2 使用 `region_code LIKE '<code>%'` 前缀匹配；site1 使用 tradingsourcevalue 与行政区划代码的映射表（S001↔510100 等）进行匹配。

#### Scenario: regionCode 筛选 site2 成都市

- **WHEN** 请求 `/api/list?regionCode=510100&category=00101&page=1&pageSize=10` 且存在 site2 记录 region_code 以 5101 开头（如 510101、510104）
- **THEN** 返回这些记录，data.total > 0

#### Scenario: regionCode 筛选 site1 阿坝州

- **WHEN** 请求 `/api/list?regionCode=513200&category=002001009` 且存在 site1 记录 tradingsourcevalue=S020（阿坝州）
- **THEN** 通过 S020↔513200 映射匹配，返回这些记录，data.total > 0

#### Scenario: regionCode 无匹配

- **WHEN** 请求 regionCode 对应地区无数据
- **THEN** data.total 为 0，data.list 为空数组

### Requirement: source 按市级行政区划筛选

`/api/list` 的 source 参数 SHALL 接受市级行政区划代码，语义与 regionCode 一致。site1 通过 tradingsourcevalue↔行政区划映射匹配；site2 若有 tradingsourcevalue 则精确或前缀匹配，若无则可通过 region_code 前缀匹配（若实现支持）。

#### Scenario: source 筛选 site1

- **WHEN** 请求 `/api/list?source=513200&category=002001009` 且存在 site1 记录 tradingsourcevalue=S020
- **THEN** 通过映射匹配，返回这些记录

#### Scenario: source 无匹配

- **WHEN** 请求 source 对应地区无数据
- **THEN** data.total 为 0

### Requirement: S-code 与行政区划映射完整

系统 SHALL 维护 tradingsourcevalue（S001～S022）与市级行政区划代码（510100、510300 等）的双向映射，与《DATA_STRUCTURE》及 FilterSheet SOURCE_OPTIONS 一致。

#### Scenario: 成都市映射

- **WHEN** 传入 regionCode 或 source=510100
- **THEN** site1 匹配 tradingsourcevalue=S001

#### Scenario: 阿坝州映射

- **WHEN** 传入 regionCode 或 source=513200
- **THEN** site1 匹配 tradingsourcevalue=S020
