# Spec: notices-api (delta)

## ADDED Requirements

### Requirement: tenderer SHALL 不返回平台名

招投标详情接口的 tenderer（招标人/采购人）字段 SHALL 不将已知平台名（如「四川政府采购网」「四川省政府采购网」）作为有效值。当 purchaser 为空且 source_name 为平台名时，tenderer 返回空，避免将平台误展示为招标人。

#### Scenario: source_name 为平台名时 tenderer 为空

- **WHEN** 记录的 purchaser 为空且 source_name 为「四川政府采购网」或「四川省政府采购网」
- **THEN** 返回的 data.tenderer 为 null 或空字符串

#### Scenario: purchaser 有值时 tenderer 正常返回

- **WHEN** 记录的 purchaser 非空
- **THEN** 返回的 data.tenderer 为 purchaser 值
