## 1. Current-State Alignment

- [ ] 1.1 Update miniapp detail-page behavior so non-公众号原文 is no longer treated as currently available through `WebView` on the personal-subject miniapp.
- [ ] 1.2 Keep公众号文章 on the 微信原生打开路径 and remove stale assumptions that `mp.weixin.qq.com` relies on ordinary `WebView` business-domain support.
- [ ] 1.3 Update docs and operator guidance to state that personal-subject miniapps cannot rely on self-hosted H5 / proxy-page `WebView` for non-公众号原文.

## 2. Degraded Experience for Personal Subject

- [ ] 2.1 Decide and document the user-facing fallback for non-公众号原文 under the current personal-subject miniapp (for example: copy link, browser guidance, or no in-app open).
- [ ] 2.2 Implement the chosen fallback consistently on bid detail and information detail pages.
- [ ] 2.3 Add regression coverage for公众号文章、个人主体下非公众号原文、无 `originUrl` 三类详情页场景.

## 3. Enterprise Miniapp Re-Enablement

- [ ] 3.1 Document the prerequisites for re-enabling non-公众号原文 `WebView`: enterprise主体、备案 HTTPS 域名、业务域名校验通过.
- [ ] 3.2 Add a re-validation checklist using a self-hosted H5 probe page before enabling `webview-proxy` or real origin sites.
- [ ] 3.3 After the enterprise miniapp is available, verify self-hosted H5, proxy page, and at least one real source site in a real device environment before re-enabling direct open.
