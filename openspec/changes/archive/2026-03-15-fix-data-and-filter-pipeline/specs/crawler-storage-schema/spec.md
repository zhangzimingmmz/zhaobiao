# Spec: crawler-storage-schema (delta)

## ADDED Requirements

### Requirement: 项目分类列

notices 表 SHALL 包含 `purchase_nature` 列（TEXT，可空），用于存储 site2 采购公告的项目分类（1=货物、2=工程、3=服务）。数据来源为 site2 API 响应的 `purchaseNature` 字段。

#### Scenario: 表结构支持 purchase_nature

- **WHEN** 爬虫或 API 写入/查询 purchase_nature
- **THEN** 表 SHALL 具备该列，可空，与 purchase_manner 等列同级
