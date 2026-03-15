# Design: 修复跳转原地址功能

## Context

- **现状**：site1 公告有 linkurl，后端用 Base + linkurl 拼装 originUrl；site2 爬虫未写入 linkurl/origin_url，导致 site2 详情与列表的 originUrl 恒为空，小程序不显示「查看原文」。
- **约束**：小程序打开外部链接需通过 WebView 全屏页面，且目标域名须在微信公众平台配置为业务域名；site2 详情页 URL 格式已由抓包文档确认。
- **涉及模块**：server（API 映射）、miniapp（招投标详情页、信息详情页）。

## Goals / Non-Goals

**Goals:**
- site2 公告在列表与详情接口中均能返回可用的 originUrl
- 详情页在有 originUrl 时提供「查看原文」入口，点击后**直接跳转**到 WebView 页面打开原网站
- 无 originUrl 时展示来源站点名称作为兜底
- 体验：用户点击即可在原网站浏览，无需复制粘贴

**Non-Goals:**
- 不修改 site2 爬虫落库逻辑（不写入 origin_url）
- 不改变 site1 现有拼装逻辑

## Decisions

### 1. site2 originUrl 拼装规则

**决策**：当 `origin_url` 和 `linkurl` 均为空且 `site` 含 `site2` 时，拼装：
```
https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id={id}&planId={planId}
```
若 `plan_id` 为空，则 `planId=` 后不跟值（或省略该参数，抓包中采购意向为 `planId` 无值）。

**备选**：在爬虫层写入 origin_url —— 需改爬虫与回填历史数据，成本高；当前拼装规则稳定，后端拼装即可。

### 2. 拼装位置

**决策**：在 `_row_list_item`、`_row_detail_bid`、`_row_detail_info` 三个映射函数中统一处理，不新增独立函数，保持与 site1 逻辑对称。

**备选**：抽取 `_assemble_origin_url(row, site)` 辅助函数 —— 可读性略好，但改动更分散；当前三处逻辑简单，直接内联即可。

### 3. 详情页无 originUrl 时的兜底

**决策**：当 `originUrl` 为空时，在详情页底部或关键信息区展示「来源：四川省政府采购网」或「来源：四川省公共资源交易平台」，根据 site 推断。不显示「查看原文」按钮。

**备选**：不展示任何来源 —— 用户无法得知数据来源，体验差。

### 4. 「查看原文」交互：WebView 直接跳转

**决策**：点击「查看原文」后，使用 `Taro.navigateTo` 跳转到 WebView 全屏页面，通过 `url` 参数传入 originUrl，由 WebView 组件加载。需在微信公众平台将 `ggzyjy.sc.gov.cn`、`www.ccgp-sichuan.gov.cn` 配置为业务域名。

**实现要点**：微信小程序的 `<web-view>` 必须作为页面根组件独占整页，不能嵌入其他页面。因此新建 `pages/webview/index` 页面，路由为 `/pages/webview/index?url={encodeURIComponent(originUrl)}`。

**备选**：复制链接 —— 用户需手动粘贴到浏览器，体验较差；用户明确要求直接跳转。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| site2 URL 格式变更 | 规则来自抓包文档，若官方改版需后续调整 |
| plan_id 为空时 URL 有效性 | 抓包中采购意向 (59) 使用 `planId` 无值，先按此实现，若异常再细化 |
| 来源站点名称硬编码 | 当前仅 site1/site2，可接受；后续多站点时可抽配置 |
| 业务域名配置 | 上线前须在微信公众平台配置 ggzyjy.sc.gov.cn、www.ccgp-sichuan.gov.cn；开发阶段可先实现跳转逻辑，域名未配置时 WebView 会提示无法打开 |
