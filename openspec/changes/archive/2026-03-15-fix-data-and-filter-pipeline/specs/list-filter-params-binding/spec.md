# Spec: list-filter-params-binding (delta)

## ADDED Requirements

### Requirement: 采购性质筛选参数传递

`index.tsx` 的 buildParams SHALL 将 `filterValues.nature?.code` 作为 `purchaseNature` 参数传给 `api.list()`；若未选采购性质则传 `undefined` 或省略。

#### Scenario: 选择采购性质后 API 调用携带 purchaseNature

- **WHEN** 用户在 FilterSheet 的「采购性质」中选择「货物」并确认
- **THEN** `api.list()` 参数中包含 `purchaseNature: '1'`

#### Scenario: 未选采购性质

- **WHEN** 采购性质筛选为空或「全部」
- **THEN** `api.list()` 不传 `purchaseNature`（或传 `undefined`，后端忽略）
