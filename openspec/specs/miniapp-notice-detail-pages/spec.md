# miniapp-notice-detail-pages Specification

## Purpose
定义招投标详情页与信息详情页的页面结构、页面内动作和原文跳转行为，确保详情体验在小程序内一致且可追溯到来源站点。
## Requirements
### Requirement: Notice detail pages SHALL use the secondary-page content family
Bid detail pages SHALL continue to use the shared secondary-page content family as their normal detail destination. Information detail pages SHALL use the same secondary-page content family only when a record lacks a direct original-link path or otherwise needs a fallback in-app detail presentation.

#### Scenario: Bid detail page is rendered
- **WHEN** the user opens a bid detail page
- **THEN** the page SHALL use the secondary-page content family instead of the retired hero-style shell or a generic unstructured page

#### Scenario: Information detail page is rendered as fallback
- **WHEN** the user opens an information detail page for a record without a direct original-link path or for a special non-standard record
- **THEN** the page SHALL use the same secondary-page content family while supporting the lighter information-detail structure appropriate to that content

### Requirement: Structured detail sections SHALL use only supported fields
Notice detail pages SHALL only promote stable supported fields into structured sections and SHALL keep the body content as raw notice content.

#### Scenario: Stable field exists
- **WHEN** a bid or info detail field is directly supported by the detail contract
- **THEN** the page SHALL render that field in the structured section defined for its detail type

#### Scenario: Field would require parsing body content
- **WHEN** a detail row would require parsing additional structure out of the raw body content
- **THEN** the page SHALL leave that information inside the notice body instead of fabricating a structured row

### Requirement: Detail-page actions SHALL stay page-local
Favorite, share, and original-link behaviors SHALL remain local to detail pages and SHALL integrate with the authenticated server-side favorites model where applicable.

#### Scenario: Bid detail favorite is toggled by logged-in user
- **WHEN** the user is logged in and toggles favorite on a bid detail page
- **THEN** the page SHALL update favorite state through the server-side favorites API instead of a local shared record cache

#### Scenario: Guest toggles favorite on detail page
- **WHEN** the user is not logged in and triggers a favorite action on a detail page
- **THEN** the page SHALL show a login-oriented gate instead of persisting a local favorite record

#### Scenario: Information detail exposes external action
- **WHEN** an information detail page offers share or original-link behavior
- **THEN** that action SHALL remain scoped to the current notice page rather than to the app shell

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
