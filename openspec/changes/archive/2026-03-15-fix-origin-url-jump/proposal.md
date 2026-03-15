# Proposal: 修复跳转原地址功能

## Why

详情页中大量 site2（四川省政府采购网）公告无法显示「查看原文」入口，用户无法跳回原网站查看完整信息或核实来源。site1 有 linkurl 可拼装 originUrl，但 site2 爬虫未写入 linkurl/origin_url，导致 API 返回的 originUrl 为空，小程序不渲染按钮。用户已确认 site2 详情页 URL 可访问，需在后端拼装并优化前端交互体验。

## What Changes

- **后端**：当 site2 记录的 origin_url 和 linkurl 均为空时，按文档规则拼装 originUrl（`/maincms-web/article?type=notice&id={id}&planId[={planId}]`），使招投标详情与信息详情接口均能返回可用的原文链接。
- **小程序**：在招投标详情页、信息详情页统一「查看原文」交互；当有 originUrl 时点击**直接跳转**到 WebView 页面打开原网站；当无 originUrl 时展示来源站点名称作为兜底。需新增 WebView 页面，并将 `ggzyjy.sc.gov.cn`、`ccgp-sichuan.gov.cn` 加入微信小程序业务域名。
- **列表接口**：同样对 site2 拼装 originUrl，保证列表项与详情页行为一致。

## Capabilities

### New Capabilities

- `origin-url-assembly`: 后端对 site2 公告在 origin_url/linkurl 为空时拼装 originUrl 的规则与实现

### Modified Capabilities

- `notices-api`: 招投标详情、信息详情、列表接口的 originUrl 字段 SHALL 对 site2 在无存储值时通过拼装规则提供；响应中 originUrl 非空时前端可展示跳转/复制入口
- `miniapp-notice-detail-pages`: 详情页 SHALL 在有 originUrl 时提供「查看原文」入口，点击后 SHALL 跳转到 WebView 页面直接打开原网站；无 originUrl 时 SHALL 展示来源站点名称作为兜底

## Impact

- **server/main.py**：`_row_list_item`、`_row_detail_bid`、`_row_detail_info` 增加 site2 originUrl 拼装逻辑
- **miniapp**：新增 `pages/webview/index` 页面（WebView 全屏加载 URL）；`pages/detail/index.tsx`、`pages/info-detail/index.tsx` 的「查看原文」改为跳转 WebView；微信公众平台需配置业务域名 `ggzyjy.sc.gov.cn`、`ccgp-sichuan.gov.cn`
- **依赖**：无新增依赖
