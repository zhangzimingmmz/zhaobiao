## 1. Info Card Media States

- [x] 1.1 Normalize information-list records so empty cover values and unsupported cover data are treated as nullable media, not as guaranteed image slots.
- [x] 1.2 Update the `InfoCard` component to support valid-cover, no-cover, and image-load-failed states with a stable minimum-height rhythm.
- [x] 1.3 Add a branded no-image placeholder treatment so no-cover and failed-cover cards do not render as gray image windows.

## 2. Direct Open Behavior

- [x] 2.1 Update information-card click behavior so records with `wechatArticleUrl` open the公众号原文 directly instead of navigating to `info-detail`.
- [x] 2.2 Keep `info-detail` as a fallback route only for records without a direct original-link path or for special probe/non-standard records.
- [x] 2.3 Ensure article view-count recording still happens on both direct-open and fallback-detail paths.

## 3. Validation and Notes

- [x] 3.1 Verify mixed lists containing image and no-image article cards still look stable on mobile.
- [x] 3.2 Verify the four key cases: valid cover, missing cover, failed cover, and missing original link.
- [x] 3.3 Update any miniapp/article documentation or acceptance notes affected by the new direct-open and media-state behavior.
