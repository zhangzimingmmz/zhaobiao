# Spec: notices-api (delta)

## CHANGED Requirements

### Requirement: tenderer SHALL 只返回结构化 purchaser 字段值

招投标详情接口的 `tenderer` 字段 SHALL 只取数据库 `purchaser` 列，不得用 `source_name` 作兜底。

- **WHEN** 记录的 `purchaser` 为空 → `data.tenderer` 返回 null
- **WHEN** 记录的 `purchaser` 非空 → `data.tenderer` 返回该值

### Requirement: 平台名黑名单机制 SHALL 被移除

`PLATFORM_NAMES` 黑名单和 `_safe_tenderer` 函数不得存在于生产代码中。

### Requirement: site2 公告的 budget、openTime 字段 SHALL 有值

来自 site2 的招投标详情，当原始数据包含 `budget`（预算）和 `openTenderTime`（开标时间）时，API 响应的 `data.budget` 和 `data.openTime` SHALL 返回对应值（非 null）。
