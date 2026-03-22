## 1. Panel Structure

- [x] 1.1 Introduce a page-level `HomeControlPanel` wrapper on the miniapp home page that groups `SecondaryTabs`, the supported announcement-type switch, search, and filter controls.
- [x] 1.2 Keep `PrimaryTabs` outside that wrapper so the first-level channel switch remains a separate page-navigation layer.
- [x] 1.3 Update the home page layout structure so the panel wrapper, not the child components, owns the unified outer background, border radius, border, and shadow.

## 2. Child Component Responsibility Cleanup

- [x] 2.1 Refactor `SecondaryTabs` styles so it no longer renders a full standalone background card when used inside the unified home control panel.
- [x] 2.2 Refactor `FilterBar` styles so its outer shell no longer behaves like an independent white card, while preserving internal search and filter affordances.
- [x] 2.3 Ensure the engineering announcement-type segment is rendered as a panel-internal section instead of a visually separate card layer.

## 3. State-Specific Validation

- [x] 3.1 Verify the engineering states render as `PrimaryTabs` + unified control panel + list, with the announcement-type switch included inside the panel.
- [x] 3.2 Verify procurement states render the same panel family while preserving one-row and two-row filter layouts as needed.
- [x] 3.3 Verify the information state remains visually lighter than engineering/procurement but still uses the same control-panel ownership model.

## 4. Visual Acceptance

- [ ] 4.1 Capture before/after screenshots for engineering, procurement, and information states to confirm the top control area now reads as two layers instead of multiple unrelated cards.
- [ ] 4.2 Check that no “card inside card” regressions remain after the panel merge, especially around `SecondaryTabs` and `FilterBar`.
- [ ] 4.3 Confirm spacing, shadow, and edge treatment still avoid clashes with the top bar and the first visible list card.
