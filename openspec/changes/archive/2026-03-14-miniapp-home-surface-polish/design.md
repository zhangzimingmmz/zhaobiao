## Context

The home route is still the densest content surface in the miniapp. Even after the earlier home-fidelity work, the page still depends on generic component logic in places where the product really needs explicit state-by-state design. The user also clarified that direct data rules matter more than demo richness, so card layout must be driven by supported fields first and visual polish second.

This change assumes the shell/navigation reset has already defined the outer page frame. It focuses only on the content area inside that frame.

## Goals / Non-Goals

**Goals:**
- Make each supported home business state feel intentional rather than generic.
- Keep home filters, cards, loading states, and empty states consistent with the accepted miniapp shell.
- Enforce direct-field-only rendering before visual presentation choices are made.
- Make parity review concrete at the content-surface level.

**Non-Goals:**
- This change does not redefine first-level navigation.
- This change does not redesign favorites, profile, login, register, or detail pages.
- This change does not add backend-only fields just to match demo richness.

## Decisions

### 1. Home SHALL be treated as a state matrix, not one reusable layout
- **Decision:** The implementation SHALL explicitly model the supported home states instead of treating them as cosmetic variants of one generic layout.
- **Why:** Engineering, procurement, and information states do not share the same control density or card needs.
- **Alternative considered:** Keep a single generic filter-and-list layout. Rejected because it is exactly what made earlier home work feel approximate.

### 2. Field normalization happens before presentation
- **Decision:** Home records SHALL be normalized into direct-field-only view models before any card layout or badge logic is applied.
- **Why:** The user does not want parsed `content` or inferred values promoted into structured UI.
- **Alternative considered:** Use a richer card component and hide unsupported rows late. Rejected because it keeps presentation tied to fields that are not contractually safe.

### 3. The `ui` reference applies from the content block downward
- **Decision:** The `ui` home page remains the visual reference for the content block, including control rhythm, card density, and overlay hierarchy, but not for the already-reset primary shell.
- **Why:** The content surface still benefits from the `ui` composition, but the shell has already been redefined for miniapp-native behavior.
- **Alternative considered:** Ignore `ui` after the shell reset. Rejected because it would throw away the strongest existing visual reference.

### 4. Loading and empty states SHALL preserve state identity
- **Decision:** Loading and empty states SHALL retain the active home-state rhythm instead of collapsing into generic placeholders.
- **Why:** State transitions feel more coherent when the page still “looks like itself” while loading or when no results match current filters.
- **Alternative considered:** Use one shared loading and one shared empty component everywhere. Rejected because it weakens the information scent of the active state.

## Risks / Trade-offs

- **Five home states increase review scope** → Use a fixed state matrix and parity checklist instead of ad hoc screenshot review.
- **Field sparsity may reduce card richness** → Prefer truthful collapsed cards over fabricated richness.
- **Overlay behavior may still differ from the web demo** → Treat shell-level differences as already-settled constraints and focus review on hierarchy and usability.

## Migration Plan

1. Stabilize the shell and header family first.
2. Normalize the home data view models under the direct-field-only rule.
3. Rebuild the content surface state by state: controls, cards, overlays, loading, empty.
4. Validate each state against shell-aware parity expectations.

## Open Questions

- Which home states need dedicated empty-state copy, and which can reuse a common pattern?
- Should unsupported direct fields collapse with tighter spacing, or preserve `ui` row rhythm even when hidden?

## Applied Notes

- The shell-aware implementation keeps the native first-level tab structure from the shell reset, so filter sheets stop above the system tab bar instead of pretending to own the whole screen.
- Bid cards now collapse category, purchaser, source, region, deadline, budget, purchase-nature, and purchase-method rows when the direct list payload does not provide them.
- Information cards only render summary and cover when those fields are directly present in the list payload; they do not backfill demo-only richness.
