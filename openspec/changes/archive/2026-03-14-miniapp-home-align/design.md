## Context

The current home page already has primary tabs, secondary tabs, list loading, and separate bid/info cards, but the implementation is still a lightweight placeholder version. `TopBar` is blue and text-based, `FilterBar` is a generic list of chips, `FilterSheet` only supports a simple option list, `BidCard` shows only a tag, title, and source, and loading uses `EmptyState` instead of a skeleton.

This change focuses only on the home surface so it can be implemented and validated independently from favorites routing and detail-page behavior.

## Goals / Non-Goals

**Goals:**
- Bring the home page structure closer to the reference UI without changing the app's overall navigation model.
- Introduce explicit home filter modes derived from `(primaryTab, secondaryTab)` instead of a single generic filter layout.
- Render richer bid-card and info-card metadata when the list item already provides those fields.
- Replace plain loading text with a repeatable skeleton card pattern.

**Non-Goals:**
- Do not add the dedicated favorites page in this change.
- Do not rework the bid detail page in this change.
- Do not implement backend search or filter result logic beyond UI state and parameter passthrough.
- Do not parse extra structured fields from `content`.

## Decisions

### 1. Use a custom home top bar instead of the system navigation bar
- **Decision:** Set the home page to use a custom navigation style and render the white top bar in-page.
- **Why:** The current blue system navigation bar cannot match the reference UI. The home page needs a white header with two right-side icon actions.
- **Alternative considered:** Keep the system navigation bar and restyle around it. Rejected because it preserves the blue chrome and duplicate title problem.

### 2. Compute a dedicated `filterType` for home rendering
- **Decision:** Derive a `filterType` from the current primary tab, secondary tab, and engineering announcement subtype, and let `FilterBar` render by mode.
- **Why:** The reference UI uses different filter layouts for engineering, procurement intention, procurement announcement, and information display states.
- **Alternative considered:** Keep a single `filters[]` array API. Rejected because it cannot express layout differences such as the plan/announcement segmented control or search placeholders by business mode.

### 3. Keep one `FilterSheet` component with type-driven content
- **Decision:** Preserve a single bottom-sheet component but expand it to render the six required sheet types using internal type switches.
- **Why:** This keeps modal plumbing centralized while allowing different input controls and option sets.
- **Alternative considered:** Create one component per sheet type. Rejected because it would duplicate overlay, animation, and footer behavior.

### 4. Use field-presence rendering for richer cards
- **Decision:** Upgrade `BidCard` and `InfoCard` to accept richer normalized props and only render a row when the corresponding field exists.
- **Why:** The list APIs are not fully consistent across site categories. Guarded rendering avoids blocking the UI on missing fields.
- **Alternative considered:** Require all fields and fill the rest with mock placeholders. Rejected because it hides real data gaps and makes later API alignment harder.

### 5. Add a dedicated skeleton component for bid lists
- **Decision:** Introduce a reusable bid-card skeleton component and render multiple instances during home loading.
- **Why:** The reference UI uses content-shaped loading placeholders, and the current text-only loading state exaggerates layout shift.
- **Alternative considered:** Reuse `EmptyState`. Rejected because it is semantically wrong for loading and does not preserve the target layout.

## Risks / Trade-offs

- **More branching in the home page** -> Keep filter-mode calculation in one place and push mode-specific rendering into components.
- **Data fields may still be missing from live APIs** -> Render rows conditionally and document the expected fields in the API mapping layer.
- **Custom navigation may require safe-area tuning on WeChat** -> Validate header height and padding on device after implementation.
- **The richer home cards may be denser than the current miniapp typography** -> Reuse shared spacing and font tokens to avoid visual drift.
