## Why

The current miniapp exposes "my favorites" only as a placeholder entry and has no actual favorites page or reusable navigation flow. Splitting favorites into its own change keeps the feature independently implementable and avoids coupling it to the broader home and detail UI alignment work.

## What Changes

- Add a dedicated favorites page to the miniapp routing configuration.
- Implement a favorites list with type tabs for bid plans, bid announcements, and procurement announcements.
- Add working favorites entry points from the home top bar and the profile page.
- Standardize local favorites storage so the favorites page and detail page can share the same record shape.
- Add empty-state handling and restore the user's last selected favorites type.

## Capabilities

### New Capabilities
- `miniapp-favorites-page`: Dedicated favorites page with type switching, list rendering, and empty state.
- `miniapp-favorites-entry`: Navigation entry points into favorites from the home header and profile page.
- `miniapp-favorites-storage`: Shared local storage contract for favorite items and selected favorites type.

### Modified Capabilities

None.

## Impact

- `miniapp/src/app.config.ts`
- New `miniapp/src/pages/favorites/*`
- `miniapp/src/pages/profile/index.tsx`
- `miniapp/src/components/TopBar/*`
- Shared local storage helpers for favorites state
- Bid card reuse in favorites lists
