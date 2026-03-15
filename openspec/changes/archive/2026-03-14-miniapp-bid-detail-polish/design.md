## Context

The current bid detail page already fetches data and renders a title card, information sections, and a rich-text body, but it still uses a generic header title, a text-based favorite action, and field names that are not tightly aligned with the target data contract. The page also lacks a shared persistence contract with the future favorites page.

This change focuses on bid detail only. It assumes the page can continue to rely on stable top-level fields returned by the bid detail API and must not derive extra structured fields from `content`.

## Goals / Non-Goals

**Goals:**
- Align the bid detail page structure and header behavior with the reference UI.
- Render stable detail fields in dedicated sections without parsing `content`.
- Persist favorite state for bid detail records using the same storage shape as the favorites flow.
- Keep the original-link action available even when some optional detail fields are missing.

**Non-Goals:**
- Do not redesign the information-detail page in this change.
- Do not parse amount, purchaser, or timeline fields out of `content`.
- Do not introduce backend favorites APIs in this change.

## Decisions

### 1. Use stable API fields only for structured sections
- **Decision:** Populate the header, project info, and important time sections only from stable top-level detail fields such as title, source, publish time, budget, purchaser, agency, region, and deadline-related timestamps.
- **Why:** The crawler and API design explicitly avoid content-derived structured fields for UI binding.
- **Alternative considered:** Parse missing values from `content`. Rejected because it would create fragile detail behavior and inconsistent field provenance.

### 2. Share favorite persistence with the favorites flow
- **Decision:** The detail page favorite toggle writes normalized records through the same storage helper used by the favorites page.
- **Why:** This keeps one favorite record contract across the miniapp and avoids duplicated local storage logic.
- **Alternative considered:** Keep detail favorites as page-local state. Rejected because the favorites page would not be able to read the saved records.

### 3. Keep original-link behavior as copy-first
- **Decision:** The original-link action keeps the current copy-to-clipboard behavior as the primary fallback when direct external navigation is restricted.
- **Why:** Miniapp external-link behavior can be constrained, while copy-to-clipboard is predictable and already partially implemented.
- **Alternative considered:** Force direct browser-style navigation. Rejected because it is not always available in the miniapp environment.

### 4. Reuse the top bar with a detail-specific action pattern
- **Decision:** Extend `TopBar` so the detail page can show a back affordance and a toggled favorite icon state without forking an entirely separate header component.
- **Why:** The detail page and home page need different header behavior, but they still benefit from shared spacing and safe-area handling.
- **Alternative considered:** Build a detail-only header component. Rejected because it would duplicate shared shell styling and interaction plumbing.

## Risks / Trade-offs

- **Some detail APIs may expose different field names than the current page expects** -> Add a normalization layer before rendering and guard optional rows.
- **Favorite data can become stale if the detail payload changes shape** -> Store only the normalized fields needed for list rendering.
- **Clipboard-only original link behavior is less direct than web navigation** -> Keep the action explicit in the UI and show confirmation feedback after copy.
