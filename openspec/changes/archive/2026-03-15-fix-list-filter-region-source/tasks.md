## 1. 编码映射

- [x] 1.1 在 server 层新增 S-code↔行政区划映射（S001→510100, S002→510300, …），与 DATA_STRUCTURE、FilterSheet SOURCE_OPTIONS 对齐
- [x] 1.2 实现「行政区划 code → S-code」反向查询函数，供 regionCode/source 筛选使用

## 2. regionCode 筛选

- [x] 2.1 修改 `/api/list` 的 regionCode 逻辑：site2 使用 `region_code LIKE ?%` 前缀匹配
- [x] 2.2 修改 regionCode 逻辑：site1 将传入的行政区划 code 转为 S-code 后对 tradingsourcevalue 精确匹配
- [x] 2.3 合并 site1、site2 条件为 OR（同一 regionCode 可匹配两站数据）

## 3. source 筛选

- [x] 3.1 修改 source 逻辑：site1 将传入的行政区划 code 转为 S-code 后对 tradingsourcevalue 精确匹配
- [x] 3.2 若 source 传入 S-code（如 S020），直接精确匹配 tradingsourcevalue，保持向后兼容

## 4. keyword 转义

- [x] 4.1 对 keyword 中的 `%`、`_`、`\` 做 LIKE 转义后再拼接 `%keyword%`
- [x] 4.2 空 keyword 或未传时不过滤

## 5. 前端 METHOD_LABELS

- [x] 5.1 修正 `miniapp/src/pages/index/index.tsx` 的 METHOD_LABELS，与 FilterSheet METHOD_OPTIONS 一致（4=竞争性磋商、5=单一来源、6=询价）

## 6. category 与回归

- [x] 6.1 当 category 未传或为空时，返回 400 或空结果，并文档化
- [x] 6.2 执行 `openspec/specs/notices-api-list-filters/TEST_CASES.md` 中用例，确认 R01、R02、S01、S03 等由失败变为通过
