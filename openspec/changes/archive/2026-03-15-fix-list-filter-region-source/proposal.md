## Why

`/api/list` 的 regionCode、source 筛选当前对用户无效：前端传行政区划代码（如 510100=成都市），后端做精确匹配，但 site1 存 S001/S020 等内部代码、site2 存 510101/510104 等区县代码，均与 510100 不匹配，导致选「成都市」时恒为 0 条。此外，METHOD_LABELS 与 FilterSheet 映射不一致、keyword 特殊字符未转义等问题也需一并修复。

## What Changes

- **regionCode 筛选**：支持按市级行政区划代码（510100 等）筛选，site2 使用 `region_code LIKE '5101%'` 前缀匹配，site1 通过 tradingsourcevalue↔行政区划映射表匹配
- **source 筛选**：同上，统一使用行政区划代码语义；site2 若无 tradingsourcevalue 则需爬虫补写或从 region_code 推导
- **编码映射**：建立 site1 tradingsourcevalue（S001/S020 等）与行政区划代码（510100 等）的双向映射，供 region/source 筛选使用
- **METHOD_LABELS 修正**：统一 index.tsx 与 FilterSheet 的采购方式 code↔label 映射，与 dict_purchase_manner 对齐
- **keyword 转义**：对 keyword 中的 `%`、`_` 做 LIKE 转义，避免误匹配
- **category 必填**：接口层强制 category 必填或明确未传时的行为

## Capabilities

### New Capabilities

- `list-filter-region-source-mapping`：regionCode/source 筛选的编码映射与匹配逻辑（前缀匹配、S-code↔行政区划映射）

### Modified Capabilities

- `notices-api`：regionCode、source 筛选的语义与跨 site 行为；keyword 转义；category 必填或默认行为
- `list-filter-params-binding`：采购方式 code 与 FilterSheet 选项、METHOD_LABELS 的一致性

## Impact

- **server/main.py**：`/api/list` 的 SQL 构建逻辑（regionCode 前缀/映射、source 映射、keyword 转义）
- **miniapp/src/pages/index/index.tsx**：METHOD_LABELS 修正
- **miniapp/src/components/FilterSheet/index.tsx**：若需调整 METHOD_OPTIONS 与 dict 对齐
- **数据/配置**：新增 tradingsourcevalue↔行政区划映射表或配置（可放 dict_region 或独立配置）
- **crawler**（可选）：site2 爬虫写入 tradingsourcevalue 或 region_code 规范化
