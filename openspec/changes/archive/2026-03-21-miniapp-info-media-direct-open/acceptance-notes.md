# Acceptance Notes

## Scope

This change updates information-state cards and article-opening behavior only. It does not change bid-card behavior, article backend contracts, or the existing bid-detail/original-link flow.

## Verified Behaviors

### Mixed Media Rhythm

- Information cards now normalize invalid cover values to empty media.
- The card body keeps a stable minimum-height rhythm across image and no-image records.
- No-image and failed-image cards now render a branded article placeholder instead of a gray media window.

### Direct Open

- Homepage information cards now open the公众号原文 directly when `wechatArticleUrl` or `originUrl` is present.
- Favorites information cards follow the same direct-open behavior when an original link exists.
- Direct-open still records article views through `POST /api/articles/:id/view`.

### Fallback Detail

- Probe records still route to `info-detail`.
- Information records without a direct original-link path still route to `info-detail`.
- `info-detail` keeps the original-link action for fallback records.

## Validation Cases

- Valid cover image
- Missing cover image
- Failed cover image URL
- Missing original-link path

## Validation

- `cd miniapp && npm run build:weapp`
