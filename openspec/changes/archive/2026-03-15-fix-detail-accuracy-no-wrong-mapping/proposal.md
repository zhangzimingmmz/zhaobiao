# Proposal: 详情页准确优先，禁止错误映射

## Why

招投标详情页出现「招标人/采购人」显示「四川政府采购网」（平台名）的错误，因后端在 purchaser 为空时用 source_name 兜底，而 site2 部分记录的 source_name 来自平台名。原则：**准确第一、丰富其次**——没有的字段不展示，有的字段尽量展示，绝不映射错误。

## What Changes

- **后端**：tenderer（招标人/采购人）SHALL 不将已知平台名（如「四川政府采购网」「四川省政府采购网」）作为有效值。当 purchaser 为空且 source_name 为平台名时，tenderer 返回空，避免错误展示。
- **后端**：列表接口的 sourceName 若存在类似问题，按相同原则处理（本变更可仅先改详情，列表若需可后续扩展）。
- **小程序**：详情页「查看原文」按钮 SHALL 不超出卡片边界，修复对齐/溢出问题（box-sizing 或宽度约束）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `notices-api`: 招投标详情接口的 tenderer 字段 SHALL 在 source_name 为平台名时不作为有效值返回
- `miniapp-notice-detail-pages`: 详情页「查看原文」按钮 SHALL 在卡片内正确对齐，不溢出

## Impact

- **server/main.py**：`_row_detail_bid` 中 tenderer 逻辑增加平台名过滤
- **miniapp**：`pages/detail/index.scss` 中 detail-card__action 样式调整
- **依赖**：无
