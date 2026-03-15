# Design: 字段语义治本——爬虫 + 服务端全面修正

## Context

### 问题全景

```
爬虫层（site2/tasks/core.py）mapped_record
  ✅ region_name: row.get("regionName")  → 正确
  ✅ purchaser: row.get("purchaser")     → 正确
  ✅ agency: row.get("agency")           → 正确
  ❌ budget: 缺失！                      → 数据库一直为空
  ❌ open_tender_time: 缺失！            → 数据库一直为空
  ❌ description: 缺失！                 → 数据库一直为空
  （三个字段在 raw_json 里有值，但从未落库）

服务端层（server/main.py）_row_detail_bid
  ❌ tenderer = purchaser or source_name
     site1 的 source_name = zhuanzai = 地方交易中心名（永远不是招标人）
     site2 的 source_name = author   = 代理机构名（也不是招标人）
     PLATFORM_NAMES 黑名单只能枚举已知平台名，无法穷举
```

### site2 字段语义

| API 字段 | 含义 | 对应存储列 |
|---------|------|-----------|
| `purchaser` | 实际采购人/招标人 | `purchaser` |
| `agency` | 代理机构 | `agency` |
| `author` | 代理机构名（同 agency） | `source_name` |
| `budget` | 采购预算 | ❌ 未落库 |
| `openTenderTime` | 开标时间 | ❌ 未落库 |
| `description` | 公告摘要 | ❌ 未落库 |
| `regionName` | 地区名 | `region_name` ✅ |

## Goals / Non-Goals

**Goals:**
- site2 的 budget、open_tender_time、description 正确落库
- tenderer 只展示有意义的 purchaser 值
- 删除黑名单机制，消除错误路径

**Non-Goals:**
- 不处理 site1 的 region_name 空值（无码表，后续单独做）
- 不从 content 正文解析招标人
- 不补跑历史数据（下次增量自动填充）

## Decisions

### 决策 1：爬虫补全缺失字段

在 `site2/tasks/core.py` 的 `mapped_record` 中补充：
```python
"budget": row.get("budget") or detail.get("budget"),
"open_tender_time": row.get("openTenderTime") or detail.get("openTenderTime"),
"description": row.get("description") or detail.get("description"),
```

`storage.py` 的 `_row_to_tuple` 已有对应的 `get("budget")`、`get("open_tender_time") or get("openTenderTime")`、`get("description")` 处理，无需改动。

### 决策 2：服务端 tenderer 只取 purchaser

```python
# 旧（错误）
"tenderer": _safe_tenderer(row["purchaser"], row["source_name"])

# 新（正确）
"tenderer": row["purchaser"] or None
```

删除 `PLATFORM_NAMES` 集合和 `_safe_tenderer` 函数。

**影响**：
- site1 的 tenderer 始终为 None → 前端不展示该行（准确优先）
- site2 的 tenderer = purchaser → 正确展示采购人

## Risks / Trade-offs

| 风险 | 评估 |
|------|------|
| 历史数据 budget/open_tender_time 仍为空 | 下次增量采集自动填充；存量可用 backfill 补跑 |
| site1 详情页关键信息更少 | 可接受，准确优先；site1 API 本身没有结构化招标人字段 |
