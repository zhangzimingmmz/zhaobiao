## Context

The existing miniapp home page can load data and switch business states, but its structure was rebuilt around reusable Taro components instead of strict reference parity. The `ui` app already expresses the intended home layout and interaction hierarchy, while the miniapp introduces additional constraints that the web demo does not cover: safe-area spacing, capsule avoidance, native tab bar layering, and Taro component behavior.

This design makes the `ui` home page the default visual and interaction truth source for the miniapp home surface. It also formalizes the two exception classes already discussed with the user: platform constraints and business-rule conflicts.

### Pre-Implementation Audit

- The home top bar used a fixed-height custom header with no safe-area or capsule avoidance, which caused title overlap in the miniapp runtime.
- The home route depended on native `tabBar`, which split bottom-sheet overlays from the visual bottom navigation model used by the `ui` reference.
- Bid cards rendered a generic superset of fields, including presentation that was not actually present in the `ui` reference hierarchy.
- Filter sheets were structured as generic typed content, but their visual hierarchy, heading model, and option layout still drifted from the `ui` reference.
- The home page treated live data and mock data as direct pass-through records instead of applying an explicit direct-field-only mapping first.

## Goals / Non-Goals

**Goals:**
- Make the home page implementation converge on the `ui` reference by default instead of treating the reference as loose inspiration.
- Define exactly when miniapp-specific deviations are allowed and what kind of replacement is preferred.
- Define exactly when business data rules override the `ui` demo presentation.
- Make parity review concrete by requiring state-based comparison rather than general “looks similar” review.

**Non-Goals:**
- This change does not redesign the `ui` reference itself.
- This change does not cover detail-page parity beyond what is necessary to avoid leaking home-specific assumptions.
- This change does not require backend API expansion to satisfy demo-only fields.
- This change does not promise pixel perfection where the miniapp runtime imposes non-negotiable UI constraints.

## Decisions

### 1. `ui` is the default source of truth for home structure and interaction
- **Decision:** The miniapp home page SHALL treat `/ui/src/app/pages/Home.tsx` and its referenced components as the default source of truth for layout order, spacing intent, tab hierarchy, filter placement, card density, and overlay presentation.
- **Why:** The last implementation drifted because it treated the `ui` app, screenshots, and current miniapp code as equal inputs.
- **Alternative considered:** Use current miniapp behavior as baseline and only borrow selective visual cues from `ui`. Rejected because it preserves the very drift this change is meant to remove.

### 2. Platform exceptions must be explicit and minimal
- **Decision:** Deviations from `ui` are allowed only when the miniapp runtime makes the `ui` behavior impractical or impossible. In those cases, implementation must use the closest replacement that preserves hierarchy and perceived behavior.
- **Why:** Without an explicit exception rule, every mismatch can be rationalized as “implementation detail,” which recreates ambiguity.
- **Examples:** safe-area padding, capsule overlap, native tab bar layering, unsupported overlay stacking, and Taro component limitations.
- **Alternative considered:** Require strict visual parity regardless of platform. Rejected because it is unrealistic for native chrome and runtime layering behavior.

### 3. When native tab bar behavior conflicts with overlay parity, parity wins
- **Decision:** If the native miniapp `tabBar` prevents filter sheets or the bottom layout from matching the `ui` interaction model, the recommended implementation is to replace it with a page-rendered navigation shell for the affected surfaces.
- **Why:** Native `tabBar` sits outside the page layer and causes the exact bottom-sheet breakage already seen in the screenshots.
- **Alternative considered:** Keep native `tabBar` and accept split overlays. Rejected because it visibly breaks the intended full-surface modal behavior.

### 4. Business data rules override demo richness
- **Decision:** The miniapp SHALL not display inferred fields, content-derived structured values, or synthetic placeholders just because they appear in the `ui` demo. The `ui` remains the presentation source only for fields that are directly supported by business rules and data contracts.
- **Why:** The user explicitly clarified that derived fields must not be promoted into card or detail structure.
- **Alternative considered:** Backfill missing fields from `content` to preserve richer demo cards. Rejected because it conflicts with the data-display rule and would make correctness depend on parsing heuristics.

### 5. Parity must be verified state-by-state
- **Decision:** Acceptance should compare the miniapp against `ui` across explicit home states and overlay states instead of “one screenshot looks close enough.”
- **Why:** The home surface has multiple business-state layouts, and partial parity in one state says little about the others.
- **Alternative considered:** One aggregate visual pass. Rejected because it misses the source of drift.

## Risks / Trade-offs

- **`ui` may include web-specific assumptions** → Treat `ui` as the default reference, but record every platform exception as an explicit decision instead of silently drifting.
- **Replacing native tab bar increases implementation cost** → Limit the shell change to surfaces where it is necessary for parity and modal layering.
- **Business-rule overrides reduce visual richness versus the demo** → Prefer truthful collapsed layouts over visually richer but invalid data presentation.
- **Parity review can become subjective again** → Use a fixed comparison matrix for primary tabs, secondary tabs, and filter overlays.

## Applied Exceptions

- **Platform exception:** The implementation hides the native miniapp `tabBar` only while the home page is visible and renders a page-level bottom navigation on home. This preserves bottom-sheet continuity without forcing the same shell change onto every non-home tab surface in the same change.
- **Platform exception:** The home top bar adds runtime safe-area and capsule avoidance spacing that does not exist in the web `ui` reference.
- **Business-display exception:** Home cards render only direct list-payload fields and omit demo richness that would require inferred, parsed, or fabricated values.

## Migration Plan

1. Freeze the current home implementation as the “pre-parity” baseline for comparison only.
2. Re-implement the home shell against the `ui` structure in parity order: top bar, primary/secondary tabs, filter area, list cards, overlay sheets, bottom navigation treatment.
3. Apply platform exceptions only where the runtime blocks the `ui` behavior.
4. Apply business-display exceptions only where the data contract blocks the `ui` demo richness.
5. Verify every target state with side-by-side comparison against `ui` before calling the change complete.

## Open Questions

- Should the home surface fully abandon native `tabBar`, or is there any acceptable partial-shell approach for just the home route?
- For collapsed card rows caused by missing direct fields, should spacing match the `ui` empty rhythm exactly or compress to fit available data?
- Which screenshots or rendered views will be treated as the official acceptance snapshots for parity review?
