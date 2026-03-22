# Spec: list-filter-params-binding (delta)

## ADDED Requirements

### Requirement: 项目分类筛选参数传递

`index.tsx` 的 buildParams SHALL 将 `filterValues.nature?.code` 作为 `purchaseNature` 参数传给 `api.list()`；若未选项目分类则传 `undefined` 或省略。

#### Scenario: 选择项目分类后 API 调用携带 purchaseNature

- **WHEN** 用户在 FilterSheet 的「项目分类」中选择「货物」并确认
- **THEN** `api.list()` 参数中包含 `purchaseNature: '1'`

#### Scenario: 未选项目分类

- **WHEN** 项目分类筛选为空或「全部」
- **THEN** `api.list()` 不传 `purchaseNature`（或传 `undefined`，后端忽略）
