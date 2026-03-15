# Proposal: 字段语义治本——爬虫落库 + 服务端映射全面修正

## Why

招投标详情页关键信息区长期存在错误数据，根本原因有两层：

1. **爬虫落库缺字段**：`site2/tasks/core.py` 的 `mapped_record` 漏掉了 `budget`、`open_tender_time`、`description` 的映射，这些字段在 raw_json 里有值，但从未落入数据库结构化列。
2. **服务端映射错误**：`server/main.py` 的 `tenderer` 字段用 `source_name` 兜底，而 site1 的 `source_name` 是「转载来源」（地方交易中心名），site2 的是「代理机构名」，两者都不是招标人。已有的 `PLATFORM_NAMES` 黑名单无法覆盖全省几十个地市平台，属于治标。

## What Changes

- **爬虫（site2 core.py）**：补全 `mapped_record` 中缺失的字段映射：`budget`、`open_tender_time`、`description`
- **服务端（main.py）**：`tenderer` 只取 `purchaser`，不再回退 `source_name`；删除 `PLATFORM_NAMES` 和 `_safe_tenderer`

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `notices-api`：`tenderer` 字段返回逻辑变更；site2 记录的 `budget`、`openTime` 等字段将有真实值
- `site2-crawler`：`mapped_record` 补全 `budget`、`open_tender_time`、`description` 落库

## Impact

- **crawler/site2/tasks/core.py**：`mapped_record` 新增 3 个字段
- **server/main.py**：删除 `PLATFORM_NAMES`、`_safe_tenderer`，修改 `tenderer` 赋值
- **数据库**：历史记录中 budget/open_tender_time/description 为空，需重新采集才能补全（下次增量自动修复）
- **前端**：无需改动，字段有值后自动展示
