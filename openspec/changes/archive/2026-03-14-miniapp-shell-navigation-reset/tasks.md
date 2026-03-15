## 1. Primary IA reset

- [x] 1.1 Define the first-level route map for `首页 / 收藏 / 我的`.
- [x] 1.2 Classify each current page into either the primary-tab family or the secondary-page family.
- [x] 1.3 Remove the old assumption that home-header actions are valid global navigation entry points.

## 2. Shared shell and header model

- [x] 2.1 Define the shared shell expectations for primary-tab pages, including bottom navigation ownership.
- [x] 2.2 Define the shared header expectations for secondary pages with back navigation.
- [x] 2.3 Reconcile safe-area, capsule spacing, and bottom inset behavior across both page families.

## 3. Navigation migration rules

- [x] 3.1 Reassign favorites to a first-level destination instead of a header shortcut.
- [x] 3.2 Reassign profile entry rules around the new primary-tab structure.
- [x] 3.3 Validate the accepted navigation model against the current miniapp platform constraints before downstream page polish begins.
