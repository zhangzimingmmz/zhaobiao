# Spec: miniapp-notice-detail-pages (delta)

## ADDED Requirements

### Requirement: 详情页 SHALL 提供「查看原文」入口并支持直接跳转

招投标详情页与信息详情页 SHALL 在接口返回的 originUrl 非空时，提供「查看原文」入口。点击后 SHALL 跳转到 WebView 页面，直接打开原网站 URL，使用户无需复制粘贴即可浏览原文。

#### Scenario: 有 originUrl 时显示查看原文按钮

- **WHEN** 详情页加载完成且 detail.originUrl 非空
- **THEN** 页面 SHALL 显示「查看原文」按钮

#### Scenario: 点击查看原文直接跳转

- **WHEN** 用户点击「查看原文」且 originUrl 存在
- **THEN** 系统 SHALL 跳转到 WebView 页面，加载并展示 originUrl 对应的原网站内容

### Requirement: 系统 SHALL 提供 WebView 页面用于加载外部 URL

系统 SHALL 提供独立的 WebView 页面，接收 URL 参数并全屏加载对应网页。该页面 SHALL 作为「查看原文」跳转的目标页。目标 URL 的域名 SHALL 已配置在微信小程序业务域名白名单中（ggzyjy.sc.gov.cn、www.ccgp-sichuan.gov.cn）。

#### Scenario: WebView 页面加载 URL

- **WHEN** 用户通过带 url 参数的路径进入 WebView 页面
- **THEN** 页面 SHALL 使用 WebView 组件加载该 URL 对应的网页内容

### Requirement: 无 originUrl 时 SHALL 展示来源站点名称

当 detail.originUrl 为空且接口返回的 sourceSiteName 非空时，招投标详情页与信息详情页 SHALL 在合适位置展示「来源：{sourceSiteName}」作为兜底，使用户知晓数据来源。

#### Scenario: 无 originUrl 时展示来源

- **WHEN** 详情页加载完成且 detail.originUrl 为空、detail.sourceSiteName 非空
- **THEN** 页面 SHALL 展示「来源：{sourceSiteName}」文案

#### Scenario: 无 originUrl 时不显示查看原文按钮

- **WHEN** detail.originUrl 为空
- **THEN** 页面 SHALL 不显示「查看原文」按钮
