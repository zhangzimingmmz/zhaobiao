## Why

The current miniapp home page has the basic tab and list structure, but it is still far from the reference UI in visual density, filtering behavior, and loading states. Splitting the original umbrella change lets us land the highest-impact home page alignment first without bundling favorites and detail-page work into the same implementation batch.

## What Changes

- Upgrade the home page top bar to a white custom header with favorites and profile icon actions.
- Replace the current generic filter row with business-state-specific home filter layouts derived from the active primary and secondary tabs.
- Implement the home filter sheet types needed by the reference UI: time, source, region, nature, method, and purchaser.
- Upgrade home list cards so bid cards can render richer metadata and info cards can render an optional cover image.
- Add a bid-card skeleton state and use it during home list loading instead of plain text loading placeholders.

## Capabilities

### New Capabilities
- `miniapp-home-topbar`: White custom top bar for the home page with favorites and profile actions.
- `miniapp-home-filters`: Home-specific filter bar and filter sheet behavior for the supported business states.
- `miniapp-home-list-cards`: Rich bid-card and info-card presentation for the home list.
- `miniapp-home-loading-states`: Skeleton-based loading treatment for the home list.

### Modified Capabilities

None.

## Impact

- `miniapp/src/pages/index/index.tsx`
- `miniapp/src/pages/index/index.config.ts`
- `miniapp/src/components/TopBar/*`
- `miniapp/src/components/FilterBar/*`
- `miniapp/src/components/FilterSheet/*`
- `miniapp/src/components/BidCard/*`
- `miniapp/src/components/InfoCard/*`
- New skeleton component(s) under `miniapp/src/components/`
- Home page data-to-UI mapping for budget, purchaser, region, deadline, and cover fields when available
