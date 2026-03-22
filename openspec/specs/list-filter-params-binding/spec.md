# list-filter-params-binding Specification

## Purpose
定义首页筛选项在小程序端的参数存储与传参规则，确保筛选 UI、状态管理和 `api.list()` 请求参数保持一致。
## Requirements
### Requirement: FilterSheet 选项携带 code 和 label
`FilterSheet` 的 `source`、`region`、`method` 等选项 SHALL 以 `{ code, label }` 对象形式存储；`onApply(type, code, label)` 回调中第二个参数 MUST 为可直接传给后端的 code 值，第三个参数为展示用 label。

#### Scenario: 选择地区后 onApply 携带 code
- **WHEN** 用户在 FilterSheet 的「地区」筛选中选择「成都市」并确认
- **THEN** `onApply('region', '510100', '成都市')` 被调用（code 为行政区划代码）

#### Scenario: 选择采购方式后 onApply 携带 code
- **WHEN** 用户选择「公开招标」并确认
- **THEN** `onApply('method', '1', '公开招标')` 被调用（code 为字典编号）

#### Scenario: 重置时 code 和 label 均为空
- **WHEN** 用户点击重置
- **THEN** `onApply(type, '', '')` 被调用

### Requirement: index.tsx 的 filterValues 存储 code 和 label
`index.tsx` 中 `filterValues` state 的每个 key SHALL 存储 `{ code: string, label: string }` 对象；`FilterBar` 展示时取 `.label`，`api.list()` 调用时取 `.code`。

#### Scenario: 选择地区后 API 调用携带 regionCode
- **WHEN** 用户在地区筛选选择「成都市」后触发列表刷新
- **THEN** `api.list()` 的参数中包含 `regionCode: '510100'`

#### Scenario: 选择采购方式后 API 调用携带 purchaseManner
- **WHEN** 用户选择「公开招标」后触发列表刷新
- **THEN** `api.list()` 参数中包含 `purchaseManner: '1'`

#### Scenario: 选择交易来源后 API 调用携带 source
- **WHEN** 用户在交易来源筛选选择某市后触发刷新
- **THEN** `api.list()` 参数中包含 `source: '<该市 code>'`

### Requirement: 时间筛选转换为 timeStart/timeEnd
`index.tsx` SHALL 将 FilterSheet 的时间快捷值（`today`/`7d`/`30d`）或自定义日期段（`startDate|endDate`）转换为后端需要的 `timeStart` 和 `timeEnd` 参数（格式 `YYYY-MM-DD 00:00:00`）后传给 `api.list()`。

#### Scenario: 快捷时间「今天」
- **WHEN** 用户选择「今天」
- **THEN** `api.list()` 参数中 `timeStart` 为今天 00:00:00，`timeEnd` 为今天 23:59:59

#### Scenario: 自定义时间段
- **WHEN** 用户选择自定义起止日期（如 2026-03-01 至 2026-03-14）
- **THEN** `api.list()` 参数中 `timeStart = '2026-03-01 00:00:00'`，`timeEnd = '2026-03-14 23:59:59'`

#### Scenario: 未选时间
- **WHEN** 时间筛选为空
- **THEN** `api.list()` 不传 `timeStart` / `timeEnd`（或传 `undefined`，后端忽略）

### Requirement: 项目分类筛选参数传递

`index.tsx` 的 buildParams SHALL 将 `filterValues.nature?.code` 作为 `purchaseNature` 参数传给 `api.list()`；若未选项目分类则传 `undefined` 或省略。

#### Scenario: 选择项目分类后 API 调用携带 purchaseNature

- **WHEN** 用户在 FilterSheet 的「项目分类」中选择「货物」并确认
- **THEN** `api.list()` 参数中包含 `purchaseNature: '1'`

#### Scenario: 未选项目分类

- **WHEN** 项目分类筛选为空或「全部」
- **THEN** `api.list()` 不传 `purchaseNature`（或传 `undefined`，后端忽略）

