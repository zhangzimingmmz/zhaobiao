## Context

`/api/list` 当前对 regionCode、source 做精确匹配：`region_code = ? OR tradingsourcevalue = ?`、`tradingsourcevalue = ?`。前端 FilterSheet 传行政区划代码（510100=成都市等），但：

- **site1**：tradingsourcevalue 存 S001/S020 等（内部字典，见 ui/guidelines/DATA_STRUCTURE.md）
- **site2**：region_code 存 510101/510104 等（区县级），tradingsourcevalue 全空

导致用户选「成都市」时恒为 0 条。测试用例见 `openspec/specs/notices-api-list-filters/TEST_CASES.md`。

## Goals / Non-Goals

**Goals:**
- regionCode、source 筛选对 site1、site2 均生效
- 前端继续传行政区划代码（510100 等），后端统一处理
- METHOD_LABELS 与 FilterSheet、dict_purchase_manner 一致
- keyword 含 `%`、`_` 时 LIKE 行为正确

**Non-Goals:**
- 不改变前端 FilterSheet 的选项结构（仍用 510100 等）
- 不强制 site2 爬虫写入 tradingsourcevalue（可仅靠 region_code 前缀匹配）

## Decisions

### 1. regionCode 筛选逻辑

**决策**：对 site2 使用 `region_code LIKE '5101%'` 前缀匹配；对 site1 使用 tradingsourcevalue→行政区划映射，将传入的 510100 转为 S001 再精确匹配。

**理由**：site2 存区县代码（510101、510104），市级 510100 需前缀匹配；site1 存 S001，需映射。

**备选**：统一改存行政区划代码 → 需爬虫与历史数据迁移，成本高。

### 2. source 筛选逻辑

**决策**：与 regionCode 共用映射。source 传入 510100 时，后端等价于 `(tradingsourcevalue = 'S001' OR region_code LIKE '5101%')`。

**理由**：前端 region 与 source 共用同一套行政区划选项，语义一致。

### 3. S-code ↔ 行政区划映射实现

**决策**：在 server 层维护硬编码映射 dict（S001→510100, S002→510300, …），按 DATA_STRUCTURE 与 FilterSheet SOURCE_OPTIONS 对齐。反向查询时：传入 510100 → 查得 S001 → 用 S001 匹配 site1。

**理由**：映射稳定、数量有限（约 21 个），无需新表或配置。

**备选**：dict_region 表扩展 → 需确认是否已有 S-code 字段，可后续迁移。

### 4. keyword 转义

**决策**：对 keyword 中的 `%`、`_`、`\` 做 LIKE 转义（`%`→`\%`，`_`→`\_`，`\`→`\\`），再包一层 `%keyword%`。

**理由**：避免用户输入 `%` 导致全表匹配。

### 5. METHOD_LABELS 修正

**决策**：以 FilterSheet METHOD_OPTIONS 为准（1=公开招标, 4=竞争性磋商, 5=单一来源, 6=询价），修正 index.tsx 的 METHOD_LABELS，与 dict_purchase_manner 对齐。

**理由**：FilterSheet 的 code 直接传给后端，展示层需一致。

### 6. category 必填

**决策**：保持 Optional，但在未传时返回 400 或空结果并文档化。不强制修改 FastAPI 签名，可在逻辑内校验。

**理由**：接口文档写必填，实现与文档一致即可。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 映射表遗漏或错误 | 与 DATA_STRUCTURE、FilterSheet 逐项核对，补充 S015 等若存在 |
| site2 某区县代码与市级前缀冲突 | 行政区划规范下不会（如 510101 属 510100），可监控异常 |
| keyword 转义影响已有调用 | 仅影响含 `%`/`_` 的 keyword，正常关键词无影响 |
| 性能：LIKE 前缀 | 可对 region_code 建索引，前缀 LIKE 能利用索引 |

## Migration Plan

1. 后端：实现映射、regionCode/source 新逻辑、keyword 转义
2. 前端：修正 METHOD_LABELS
3. 回归：执行 `openspec/specs/notices-api-list-filters/TEST_CASES.md` 用例
4. 无数据迁移，无回滚复杂度
