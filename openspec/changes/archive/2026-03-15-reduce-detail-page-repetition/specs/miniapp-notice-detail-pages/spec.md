# Spec: miniapp-notice-detail-pages (delta)

## ADDED Requirements

### Requirement: 招投标详情页关键信息 SHALL 不重复展示已在卡片中的字段

招投标详情页的「关键信息」区块 SHALL 仅展示未在顶部信息卡片中展示的字段。SHALL 不包含「发布时间」与「项目名称」，因二者已在信息卡片中通过标题与发布时间展示。

#### Scenario: 关键信息不包含发布时间

- **WHEN** 招投标详情页渲染且 detail.publishTime 非空
- **THEN** 「关键信息」区块 SHALL 不展示「发布时间」行

#### Scenario: 关键信息不包含项目名称

- **WHEN** 招投标详情页渲染且 detail.projectName 非空
- **THEN** 「关键信息」区块 SHALL 不展示「项目名称」行
