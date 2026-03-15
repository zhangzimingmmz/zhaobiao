# Tasks: 字段语义治本

## 1. 爬虫落库补全缺失字段

- [x] 1.1 在 `crawler/site2/tasks/core.py` 的 `mapped_record` 中补充：
  - `"budget": row.get("budget") or detail.get("budget")`
  - `"open_tender_time": row.get("openTenderTime") or detail.get("openTenderTime")`
  - `"description": row.get("description") or detail.get("description")`

## 2. 服务端删除黑名单机制

- [x] 2.1 在 `server/main.py` 中删除 `PLATFORM_NAMES` 集合定义
- [x] 2.2 删除 `_safe_tenderer` 函数

## 3. 服务端修正 tenderer 映射

- [x] 3.1 在 `_row_detail_bid` 中将 `tenderer` 改为 `row["purchaser"] or None`
