# Design: 详情页准确优先，禁止错误映射

## Context

- **现状**：tenderer = purchaser or source_name；当 purchaser 为空时，source_name 可能为平台名「四川政府采购网」，被错误展示为招标人。
- **原则**：准确第一、丰富其次。无数据不展示，有数据尽量展示，绝不映射错误。

## Goals / Non-Goals

**Goals:**
- tenderer 不展示平台名
- 查看原文按钮在卡片内正确对齐

**Non-Goals:**
- 不解析 content 正文提取更多关键信息（复杂度高，易出错）
- 不修改爬虫落库逻辑

## Decisions

### 1. 平台名过滤

**决策**：定义平台名黑名单 `{"四川政府采购网", "四川省政府采购网"}`。当 `tenderer = purchaser or source_name` 得到的值在黑名单内时，返回 `None`（不展示）。

**实现**：`tenderer = row["purchaser"] or row["source_name"]`；若 `tenderer in PLATFORM_NAMES`，则 `tenderer = None`。

**备选**：仅当 purchaser 为空且 source_name 为平台名时过滤——逻辑等价，采用黑名单更清晰。

### 2. 按钮对齐

**决策**：为 `detail-card__action` 增加 `box-sizing: border-box` 与 `max-width: 100%`，避免 padding 导致宽度溢出。若父级已有约束，可仅加 `box-sizing`。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 平台名黑名单遗漏 | 当前仅两处，后续可扩展；若发现新平台名再补充 |
| 过滤后 tenderer 常为空 | 符合「无数据不展示」原则，关键信息区块可能为空或仅一条，可接受 |
