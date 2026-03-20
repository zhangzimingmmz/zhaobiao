## MODIFIED Requirements

### Requirement: 详情页 SHALL 提供「查看原文」入口并按可用能力分流

招投标详情页与信息详情页 SHALL 在接口返回的 `originUrl` 非空时提供「查看原文」入口。点击后 SHALL 根据链接类型与当前小程序能力选择打开方式,不得默认假设所有原文都可通过 `WebView` 直接打开。

#### Scenario: 公众号文章使用微信原生能力

- **WHEN** 用户点击「查看原文」且 `originUrl` 为 `https://mp.weixin.qq.com/` 链接
- **THEN** 系统 SHALL 使用微信原生公众号文章打开能力而不是普通 `WebView`

#### Scenario: 企业主体下允许非公众号原文走 WebView

- **WHEN** 用户点击「查看原文」且 `originUrl` 不是公众号文章链接,并且小程序已具备企业主体下的 `WebView` 与业务域名能力
- **THEN** 系统 SHALL 跳转到 `WebView` 页面加载自有 H5 或代理页

#### Scenario: 个人主体下不得把非公众号原文建模为可直接打开

- **WHEN** 用户点击「查看原文」且 `originUrl` 不是公众号文章链接,但当前小程序主体不具备可用的 `WebView` 能力
- **THEN** 系统 SHALL 提供降级处理,而不是把该链接视为当前可直接打开能力

### Requirement: 系统 SHALL 仅在满足平台条件时提供 WebView 页面用于加载外部 URL

系统 SHALL 保留独立的 `WebView` 页面作为未来企业主体场景的目标页,但该能力 MUST 依赖可验证的平台条件。对于当前不满足条件的主体类型,系统 MUST NOT 将该页面定义为非公众号原文的默认能力。

#### Scenario: 企业主体启用 WebView 能力

- **WHEN** 小程序主体为企业主体,并且目标域名已完成 HTTPS、备案、业务域名配置与微信校验
- **THEN** 系统 SHALL 允许 `WebView` 页面加载对应 URL

#### Scenario: 企业主体切换前先验证自有 H5 探针页

- **WHEN** 团队准备重新启用非公众号原文的 `WebView` 能力
- **THEN** 系统 SHALL 先以自有 H5 探针页完成真机验证,再验证代理页和真实原文站点

#### Scenario: 个人主体下不把业务域名白名单视为已可用

- **WHEN** 当前小程序仍为个人主体
- **THEN** 规格 SHALL 不要求系统以业务域名白名单为前提提供非公众号原文 `WebView` 能力
