# Spec: site2-crawler (delta)

## CHANGED Requirements

### Requirement: mapped_record SHALL 包含 budget、open_tender_time、description

site2 爬虫落库时，`mapped_record` SHALL 包含以下字段的映射，不得遗漏：

- `budget`：取自 `row.get("budget") or detail.get("budget")`
- `open_tender_time`：取自 `row.get("openTenderTime") or detail.get("openTenderTime")`
- `description`：取自 `row.get("description") or detail.get("description")`

**WHEN** 原始 API 返回 `budget` 非空
**THEN** 数据库 `notices.budget` SHALL 存储该值（不为 null/空字符串）
