# Acceptance Notes

## Scope

This redesign stayed within the UI shell and presentation layer for the first-level miniapp pages and home list surfaces. No API contract, routing ownership, or filtering semantics were changed.

## Verified States

### Engineering

- Primary channel switch remains `construction`.
- Secondary switch still exposes `engineering` and `procurement`.
- Engineering state still supports the announcement-type switch for `plan` and `announcement`.
- Search input still binds to the same `keyword` state and `api.list` params.
- Filter buttons still open the same time and source sheets.

### Government Procurement

- Primary channel switch remains `government`.
- Secondary switch still exposes `intention` and `announcement`.
- Procurement intention still supports time and region filters.
- Procurement announcement still supports nature, method, time, and region filters.
- All procurement list requests still flow through the existing `api.list` binding.

### Information

- Primary channel switch remains `info`.
- Secondary switch still exposes `work_dynamics`, `policy`, and `other`.
- Information list still binds to `api.getArticles`.
- Search still updates the shared keyword state.
- Probe card and article card routing behavior were preserved.

## Component Ownership Notes

- Homepage visual ownership is now centered on custom `PrimaryTabs`, `SecondaryTabs`, `FilterBar`, `BidCard`, and `InfoCard`.
- `taro-ui` remains available for form-oriented pages and filter-sheet internals, but homepage navigation/search no longer depends on `AtSegmentedControl` or `AtSearchBar`.

## Validation

- `cd miniapp && npm run build:weapp`
