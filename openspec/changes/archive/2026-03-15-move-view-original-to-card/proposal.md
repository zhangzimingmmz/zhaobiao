# Proposal: 将「查看原文」移入信息卡片

## Why

当前「查看原文」按钮位于详情页底部，长正文时用户需滚动到底才能看到，不利于快速跳转原网站。将入口移入顶部信息卡片（标题、发布时间下方），与来源信息同属元数据区域，提升可见性与操作效率。

## What Changes

- **招投标详情页**：将「查看原文」按钮从页脚移入 `detail-card` 内部，置于发布时间下方；无 originUrl 时的「来源：{sourceSiteName}」同样移入卡片。
- **信息详情页**：将「查看原文」与「来源」从页脚移入 `info-detail__head` 卡片内部，置于发布时间下方。
- **页脚**：移除原 footer 中的查看原文与来源展示，footer 可保留为空或移除（若无需其他内容）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `miniapp-notice-detail-pages`: 详情页「查看原文」与「来源」入口 SHALL 位于信息卡片内部（标题、发布时间下方），而非页脚

## Impact

- **miniapp**：`pages/detail/index.tsx`、`pages/info-detail/index.tsx` 布局调整；`pages/detail/index.scss`、`pages/info-detail/index.scss` 样式微调
- **API**：无
- **依赖**：无
