## MODIFIED Requirements

### Requirement: 小程序展示文章详情

小程序 SHALL 在用户点击文章后跳转到信息详情页,并在详情页内按链接类型选择打开原文的方式。公众号文章不得再被定义为通过普通 `WebView` 直接加载的唯一实现。

#### Scenario: 点击文章进入详情页

- **WHEN** 用户点击文章列表中的某篇文章
- **THEN** 小程序 SHALL 调用 `GET /api/articles/:id` 获取文章详情并进入信息详情页

#### Scenario: 点击公众号文章原文

- **WHEN** 信息详情页的 `wechatArticleUrl` 为公众号文章链接
- **THEN** 小程序 SHALL 通过微信原生公众号文章能力打开原文

#### Scenario: 文章详情原文不是公众号链接

- **WHEN** 信息详情页的原文链接不是公众号文章链接
- **THEN** 小程序 SHALL 按详情页原文分流策略决定是否允许走 `WebView` 或执行降级处理

### Requirement: 小程序打开公众号文章 SHALL 依赖微信原生能力而非业务域名 WebView

小程序 SHALL 将公众号文章打开能力建模为微信原生能力。系统 MUST NOT 要求在生产环境通过将 `mp.weixin.qq.com` 作为普通业务域名来完成公众号文章展示。

#### Scenario: 开发与生产环境打开公众号文章

- **WHEN** 用户在任意环境点击公众号文章原文
- **THEN** 系统 SHALL 优先使用微信原生公众号文章打开能力

#### Scenario: 微信原生能力不可用时兜底

- **WHEN** 运行环境不支持微信原生公众号文章能力
- **THEN** 系统 SHALL 提供明确的兜底处理,而不是宣称普通 `WebView` 为默认方案
