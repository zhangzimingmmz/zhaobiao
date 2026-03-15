## Context

The archived home-alignment work improved the home surface but left the miniapp with a split personality: home uses one shell model, while profile, login, register, and other pages still use an older blue-header model. The user has now clarified a stronger product direction: favorites should become a first-level destination, home should stop carrying global favorite/profile actions, and the miniapp should follow native navigation habits before chasing full visual parity with the web demo.

The existing main specs created by `miniapp-home-ui-faithful` still assume that home owns more of the shell than it should. This change resets those assumptions before any further page-level polish continues.

## Goals / Non-Goals

**Goals:**
- Define a stable first-level navigation model for the miniapp.
- Separate primary-tab pages from secondary pages that use back navigation.
- Remove duplicated global entry points from the home top bar.
- Reframe home parity so it applies to the content surface inside the accepted primary shell.

**Non-Goals:**
- This change does not fully polish the home content area, favorites content area, or profile details.
- This change does not redesign login, register, audit, or detail pages in full.
- This change does not require backend API changes.

## Decisions

### 1. The canonical primary IA is `首页 / 收藏 / 我的`
- **Decision:** The miniapp SHALL use three first-level destinations as the canonical app structure: home, favorites, and profile.
- **Why:** The user wants favorites promoted out of a header action and into a stable destination that matches miniapp navigation habits.
- **Alternative considered:** Keep favorites and profile as home-header actions with only two bottom tabs. Rejected because it keeps global navigation hidden inside one page and perpetuates the current inconsistency.

### 2. Page families SHALL be explicit
- **Decision:** Pages SHALL be divided into two families:
  - primary-tab pages: home, favorites, profile
  - secondary pages: login, register, audit-status, bid detail, info detail
- **Why:** The current app mixes header and shell rules across all pages, making every layout decision page-specific instead of systemic.
- **Alternative considered:** Let each page define its own header and shell. Rejected because it is the source of the current drift.

### 3. Home SHALL not carry global favorite/profile actions
- **Decision:** The home top bar SHALL stop exposing favorite and profile entry actions once favorites and profile become first-level destinations.
- **Why:** Those actions duplicate the new primary navigation and make the home shell look unlike a normal miniapp tab page.
- **Alternative considered:** Keep them as shortcuts. Rejected because the user explicitly prefers a cleaner, more native top area.

### 4. Miniapp-native primary navigation is preferred by default
- **Decision:** The implementation SHOULD prefer native miniapp tab behavior for first-level navigation unless it causes unacceptable interaction breakage that cannot be resolved within the accepted shell.
- **Why:** The product direction has shifted from “copy the web demo exactly” to “behave like a good miniapp first, then match the visual language where possible.”
- **Alternative considered:** Keep a fully custom page-rendered bottom navigation everywhere. Rejected because it overfits the web demo and underfits the target platform.

### 5. `ui` remains a visual reference, not a global-shell authority
- **Decision:** The `ui` app SHALL remain the visual reference for page composition and styling intent, but it SHALL no longer override the accepted miniapp information architecture.
- **Why:** The web demo only has two bottom destinations and does not define a complete miniapp-native shell.
- **Alternative considered:** Continue treating `ui` as the single source of truth for global shell decisions. Rejected because it conflicts with the clarified product direction.

## Risks / Trade-offs

- **Native tab behavior may constrain some overlay effects** → Keep overlay expectations explicit and allow limited shell exceptions only where necessary.
- **Changing first-level navigation may invalidate old assumptions in active work** → Supersede outdated changes before new implementation begins.
- **Primary and secondary page families may still drift visually** → Follow-up changes must explicitly target each page family rather than freeform polish.

## Migration Plan

1. Freeze the old “home owns favorites/profile entry” model by archiving outdated miniapp changes.
2. Establish the new primary IA and page-family boundaries in specs and tasks before any further page polish.
3. Rebuild downstream page changes on top of this shell reset instead of reviving the older assumptions.

## Open Questions

- Should the favorites tab remain fully browsable for guests, or should some states push harder toward login?
- Is any page outside the current list likely to join the primary-tab family later?
