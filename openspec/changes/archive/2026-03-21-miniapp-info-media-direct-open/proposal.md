## Why

当前「信息展示」列表把公众号文章当作普通站内内容处理,导致两个体验问题同时出现: 列表中的有图/无图文章混排时缺乏明确的媒体状态策略,坏图或无图会留下灰色空窗; 卡片点击后还要先进入一个信息详情中转页,但该页通常不提供比公众号原文更多的独立信息。

现在需要把「信息展示」重新明确为公众号文章分发入口: 列表卡片必须稳定支持有图、无图和坏图降级三种媒体状态,同时将卡片主点击行为改为直接打开公众号原文,避免继续维护价值有限的站内详情中转层。

## What Changes

- 调整信息展示卡片的媒体策略,显式支持有图文章、无图文章、坏图加载失败文章三种状态,移除“灰色空窗就是正式无图态”的表现。
- 调整信息展示卡片的高度策略,为标题、摘要、时间等区域设定更稳定的行数和最小高度,减少当前列表忽高忽低的观感。
- 将带 `wechatArticleUrl` 的信息卡片主点击行为改为直接打开公众号文章,不再默认先进信息详情页。
- 将信息详情页降级为兜底页: 仅在缺少公众号原文链接或存在特殊非公众号记录时继续承接站内展示。
- 明确文章接口中的封面字段允许为空,前端需要将“无图”和“坏图”统一视为无图态处理。

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `miniapp-article-display`: 文章列表卡片的媒体态与卡片点击行为发生变化,从“先站内详情再原文”调整为“优先直达公众号原文”。
- `miniapp-home-card-presentation`: 信息卡片的展示规则需要新增有图/无图/坏图降级态和更稳定的高度策略。
- `miniapp-notice-detail-pages`: 信息详情页的职责收缩为兜底承接,不再作为公众号文章的默认主入口。

## Impact

- Affected code: `miniapp/src/pages/index/index.tsx`, `miniapp/src/components/InfoCard/*`, `miniapp/src/pages/info-detail/index.tsx`, article-related service wiring.
- Affected APIs/contracts: `GET /api/articles`, `GET /api/articles/:id` 的封面字段空值处理约定与前端消费方式。
- Affected UX: 信息展示列表点击路径、卡片高度节奏、无图/坏图视觉策略。
