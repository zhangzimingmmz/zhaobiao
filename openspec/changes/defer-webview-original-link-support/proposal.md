## Why

当前小程序在个人主体下无法通过 `web-view` 打开自有 H5 或代理页,导致非公众号原文链接在小程序内不可用。现有实现和部分主 spec 仍假设详情页可以直接跳转 `WebView` 打开原站,这与真机验证结果不一致,需要先把约束和后续企业主体切换后的处理路径记录清楚。

## What Changes

- 记录并确认个人主体小程序下,非公众号原文链接不再以 `WebView` 作为当前可用能力。
- 将信息详情页与公告详情页的原文打开策略改为按链接类型和小程序主体能力分流。
- 保留公众号文章通过微信原生能力打开的路径,不再将其建模为普通 `WebView` 能力。
- 为未来切换企业主体小程序后重新启用 `web-view + 业务域名` 预留明确条件、校验步骤和实现任务。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `miniapp-notice-detail-pages`: 更新详情页“查看原文”行为,使其按可用能力分流,并将企业主体下的 `WebView` 启用条件显式化。
- `miniapp-article-display`: 更新文章详情页打开公众号文章的能力定义,不再要求通过普通 `WebView` 直接加载公众号文章。

## Impact

- 小程序详情页与文章详情页的原文打开逻辑
- 原有 `WebView` 页面和 `api/webview-proxy` 路径的定位
- 微信公众平台配置说明、运维文档和后续企业主体迁移检查项
