## MODIFIED Requirements

### Requirement: 小程序展示文章列表
小程序 SHALL 在「信息展示」tab 展示已发布文章列表,包含标题、发布时间,并在封面可用时展示封面图。文章列表 SHALL 支持有图、无图和坏图降级三种媒体状态,其中无图与坏图 SHALL 统一表现为无图态而不是灰色空窗。

#### Scenario: 加载文章列表
- **WHEN** 用户进入「信息展示」tab
- **THEN** 小程序调用 GET /api/articles 接口,展示文章列表

#### Scenario: 文章列表为空
- **WHEN** 用户进入「信息展示」tab,但没有已发布文章
- **THEN** 小程序展示空状态提示"暂无信息展示内容"

#### Scenario: 文章列表分页加载
- **WHEN** 用户滚动到列表底部
- **THEN** 小程序自动加载下一页文章

#### Scenario: 文章列表下拉刷新
- **WHEN** 用户下拉列表
- **THEN** 小程序重新加载第一页文章

#### Scenario: 文章无封面图
- **WHEN** 某篇文章的 `coverImageUrl` 为空
- **THEN** 列表 SHALL 渲染无图态信息卡,而不是保留图片灰窗

#### Scenario: 文章封面加载失败
- **WHEN** 某篇文章的 `coverImageUrl` 存在但图片资源加载失败
- **THEN** 列表 SHALL 将该卡片降级为无图态信息卡

### Requirement: 小程序展示文章详情
小程序 SHALL 将公众号文章列表视为原文分发入口。带 `wechatArticleUrl` 的公众号文章 SHALL 在卡片点击时直接打开公众号原文; 仅当文章缺少可直接打开的原文链接或属于特殊记录时,小程序才进入站内信息详情页兜底展示。

#### Scenario: 点击文章直达公众号原文
- **WHEN** 用户点击文章列表中的某篇文章,且该文章存在 `wechatArticleUrl`
- **THEN** 小程序 SHALL 直接打开公众号原文,而不是默认先进入站内信息详情页

#### Scenario: 文章缺少原文链接
- **WHEN** 用户点击文章列表中的某篇文章,但该文章不存在可直接打开的 `wechatArticleUrl`
- **THEN** 小程序 SHALL 进入站内信息详情页作为兜底

#### Scenario: 特殊记录仍可进入详情页
- **WHEN** 记录属于测试或未来非公众号类型,不适合直接打开公众号原文
- **THEN** 小程序 MAY 继续进入站内信息详情页承接

## REMOVED Requirements

### Requirement: web-view 页面配置业务域名
**Reason**: 公众号文章不再通过小程序 `web-view` 作为默认主路径加载,而改为微信原生公众号文章打开能力。
**Migration**: 文章卡片点击逻辑迁移为优先使用 `wechatArticleUrl` 直达公众号原文; 现有 `web-view` 页面不再承担公众号文章默认打开职责。

### Requirement: 小程序提供返回列表功能
**Reason**: 该 requirement 以 `web-view` 作为公众号文章默认载体,与新的“卡片直达公众号原文”路径不一致。
**Migration**: 列表返回行为由微信原生公众号文章打开能力和小程序原始导航栈共同承担,不再要求单独的文章 `web-view` 返回提示。

### Requirement: 小程序记录文章浏览
小程序 SHALL 在用户触发文章主打开行为时记录浏览行为,无论该行为是直接打开公众号原文还是进入兜底详情页。

#### Scenario: 记录直达原文浏览
- **WHEN** 用户点击文章卡片并直接打开公众号原文
- **THEN** 小程序调用 POST /api/articles/:id/view 接口记录浏览

#### Scenario: 记录兜底详情浏览
- **WHEN** 用户点击文章卡片并进入兜底信息详情页
- **THEN** 小程序调用 POST /api/articles/:id/view 接口记录浏览
