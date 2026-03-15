## Why

Favorites and profile were previously planned as side flows entered from the home header, but the product direction has shifted: favorites should be a first-level destination, and profile should behave like a proper tab surface instead of a leftover legacy page. These two surfaces now need to be redesigned together around the new miniapp information architecture.

## What Changes

- Promote favorites into a full primary-tab surface with type switching, empty states, and guest handling.
- Redesign profile as a stateful tab surface for guest, pending, approved, and rejected account states.
- Define a shared favorites storage contract used by favorites lists and by page-local favorite actions elsewhere.
- Remove duplicated favorites-entry assumptions from home and from profile itself.

## Capabilities

### New Capabilities
- `miniapp-favorites-tab-page`: Defines the favorites tab surface, type switching, guest state, and empty state behavior.
- `miniapp-profile-tab-surface`: Defines the profile tab surface for guest and authenticated account states.
- `miniapp-favorites-storage-model`: Defines the shared local favorites record shape and selection persistence rules.

### Modified Capabilities

None.

## Impact

- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/favorites/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/profile/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/app.config.ts`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/BottomNav/*`
- Shared favorites storage helpers used by tab pages and detail pages
