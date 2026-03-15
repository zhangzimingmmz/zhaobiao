# Spec: list-filter-params-binding (delta)

## ADDED Requirements

### Requirement: 采购方式 code 与 FilterSheet 一致

`index.tsx` 的 METHOD_LABELS 与 FilterSheet 的 METHOD_OPTIONS SHALL 使用相同的 code↔label 映射，并与 dict_purchase_manner 对齐。标准映射：1=公开招标、2=邀请招标、3=竞争性谈判、4=竞争性磋商、5=单一来源、6=询价。

#### Scenario: 采购方式展示正确

- **WHEN** 后端返回 purchaseManner=4
- **THEN** 列表卡片展示「竞争性磋商」（非「单一来源」）

#### Scenario: 筛选与展示一致

- **WHEN** 用户在 FilterSheet 选择「竞争性磋商」并确认
- **THEN** api.list() 收到 purchaseManner='4'，与 METHOD_LABELS[4] 一致
