## Context

The old favorites-flow change assumed favorites was a secondary page reached from the home header or the profile page. That assumption is no longer valid. At the same time, profile still uses an older visual system and mixes account information, favorites entry, settings, and logout under a page shell that no longer matches the intended app direction.

These two surfaces now belong to the same product problem: what should users see in the second and third primary tabs, both before and after login/certification?

## Goals / Non-Goals

**Goals:**
- Define favorites as a proper first-level tab surface.
- Define profile as a proper first-level tab surface for guest and authenticated states.
- Standardize favorites storage so favorites and detail actions can share one record model.
- Remove duplicated or contradictory favorites entry patterns.

**Non-Goals:**
- This change does not redesign the home content surface.
- This change does not redesign login, register, audit-status, or detail pages in full.
- This change does not require a server-side favorites API before the UX is stabilized.

## Decisions

### 1. Favorites SHALL be browsable as a first-level tab
- **Decision:** Favorites SHALL exist as its own primary-tab surface rather than as a page hidden behind a header shortcut.
- **Why:** Users expect saved content to be directly reachable, and the new IA treats favorites as a core destination.
- **Alternative considered:** Keep favorites reachable only from home or profile. Rejected because it preserves the older, less discoverable model.

### 2. Profile SHALL focus on account state, not on replacing navigation
- **Decision:** Profile SHALL center on guest/authenticated state, certification state, settings, support, and logout, rather than on acting as a navigation hub for favorites.
- **Why:** Once favorites becomes a first-level destination, profile should stop duplicating it as a primary CTA.
- **Alternative considered:** Keep “my favorites” as the most prominent profile block. Rejected because it duplicates the new bottom navigation.

### 3. Favorites storage SHALL be normalized and shared
- **Decision:** Favorites SHALL use one normalized local record model shared by favorites lists and page-local favorite actions.
- **Why:** Without one shared contract, favorites pages and detail pages will drift again.
- **Alternative considered:** Let each page store ad hoc favorite payloads. Rejected because it makes cross-page sync brittle.

### 4. Guest behavior SHALL be explicit
- **Decision:** Favorites and profile SHALL both define explicit guest states instead of silently redirecting every unauthenticated interaction.
- **Why:** The user experience is clearer when the tab still renders, shows context, and then presents a login CTA where needed.
- **Alternative considered:** Hard-redirect guests from both tabs into login. Rejected because it makes the tab structure feel unstable.

## Risks / Trade-offs

- **Guest-tab behavior can create product ambiguity** → Make guest states and next actions explicit in specs.
- **Local-storage favorites may later diverge from server truth** → Stabilize the UX contract first, then add remote sync on top.
- **Profile may feel sparse after removing favorites duplication** → Rebuild the page around account-state clarity instead of filler blocks.

## Migration Plan

1. Stop treating favorites as a home/profile shortcut problem.
2. Define the favorites tab, profile tab, and shared favorites record model.
3. Let later detail-page work plug into the storage contract rather than inventing its own favorite model.

## Open Questions

- Should the favorites tab allow browsing saved items while logged out if cached data exists, or should it always show a guest gate?
- How much profile detail should be visible while certification is pending or rejected?
