## Context

The current miniapp does not have a `pages/favorites` route, and the profile page still shows a toast placeholder for favorites. The reference UI already has a favorites page with type tabs and local-state persistence, so a separate favorites change can be implemented without waiting for the rest of the UI alignment work to finish.

Favorites in the current app are best modeled as local state because there is no confirmed server favorites API wired into the miniapp yet. The detail page can later use the same local storage contract.

## Goals / Non-Goals

**Goals:**
- Add a real favorites page to the miniapp.
- Provide a stable, reusable local storage shape for favorite records.
- Support tab-based filtering for the three favorites types used by the product.
- Make favorites reachable from both the home header and the profile page.

**Non-Goals:**
- Do not introduce a server-side favorites API in this change.
- Do not rework the home filter system in this change.
- Do not redesign bid-detail content sections in this change.

## Decisions

### 1. Use a normal page route instead of a tab page for favorites
- **Decision:** Register favorites as a regular page and navigate to it explicitly.
- **Why:** Favorites is a secondary destination and should not occupy a bottom-tab slot.
- **Alternative considered:** Add favorites to the tab bar. Rejected because it would displace an existing primary destination.

### 2. Persist favorites in Taro storage with a normalized record shape
- **Decision:** Store favorites and the selected favorites tab in Taro storage under explicit keys.
- **Why:** It works offline, does not depend on backend readiness, and matches the current stage of the miniapp.
- **Alternative considered:** Keep favorites only in component state. Rejected because the page and detail view need shared persistence.

### 3. Reuse the bid card in favorites lists
- **Decision:** Favorites will reuse the bid card component for bid-like favorites and only require the normalized fields that card needs.
- **Why:** This keeps favorites visually aligned with the main list and reduces duplicate presentation logic.
- **Alternative considered:** Build a separate favorites-only card. Rejected because it creates another parallel card style to maintain.

### 4. Use lightweight type tags for filtering
- **Decision:** The favorites page filters records by stored type metadata rather than by recomputing type from page context.
- **Why:** Stored type fields make filtering deterministic after app restarts and remove dependence on the source page.
- **Alternative considered:** Infer type from raw IDs or category codes every time. Rejected because the miniapp favorites set may span multiple sources with different coding schemes.

## Risks / Trade-offs

- **Local-only persistence can diverge from future backend favorites** -> Keep the storage access behind helper functions so it can be swapped later.
- **Favorites may contain mixed field completeness** -> Normalize required card fields when saving favorites and tolerate missing optional fields.
- **Entry points span multiple pages** -> Keep favorites navigation in shared helper callbacks to avoid route drift.
