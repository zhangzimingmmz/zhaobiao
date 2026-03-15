# Proposal: 减少招投标详情页重复内容

## Why

招投标详情页存在明显的内容重复，影响阅读体验：① **发布时间** 在顶部信息卡片与「关键信息」区块重复展示；② **项目名称** 与卡片标题（title）实质相同（后端 projectName 复用 title），在关键信息中再次展示造成冗余。公告正文开头的重复来自爬虫原始 HTML 格式，暂不处理。

## What Changes

- **招投标详情页**：从「关键信息」区块的 `structuredRows` 中排除「发布时间」与「项目名称」两项，因二者已在顶部信息卡片中展示。关键信息仅保留：预算金额、地点、招标人/采购人、代理机构、报名开始、报名截止、开标时间等卡片未展示的字段。
- **信息详情页**：若存在类似重复（如发布时间在 head 与结构化区重复），按相同原则排除。当前信息详情页无「关键信息」区块，仅 head + 摘要 + 正文，重复较少，可一并检查。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `miniapp-notice-detail-pages`: 招投标详情页「关键信息」区块 SHALL 不包含已在信息卡片中展示的字段（发布时间、项目名称/标题）

## Impact

- **miniapp**：`pages/detail/index.tsx` 中 `structuredRows` 的构建逻辑，移除「发布时间」「项目名称」两项
- **API**：无
- **依赖**：无
