## MODIFIED Requirements

### Requirement: Favorites SHALL be a first-level tab surface
Favorites SHALL exist as a first-level destination with its own surface instead of relying on a page-local shortcut from another tab. That surface SHALL include a favorites-specific local section that contains the type switch and the list area, rather than placing a generic tab control directly beneath the top header without page structure.

#### Scenario: Favorites tab is selected
- **WHEN** the user enters the favorites destination
- **THEN** the miniapp SHALL render a dedicated favorites tab surface rather than a placeholder or redirected home shortcut

#### Scenario: Favorites tab switches types
- **WHEN** the user changes the favorites type filter
- **THEN** the favorites surface SHALL update within the same tab context and keep the type switch visually attached to the favorites page section

### Requirement: Favorites SHALL support guest and empty states explicitly
The favorites tab SHALL define explicit behavior for guests and for users with no saved items. Guest, empty, and loaded states SHALL all preserve the current favorites type context instead of collapsing into a generic blank board.

#### Scenario: Guest enters favorites
- **WHEN** the user is not logged in and enters the favorites tab
- **THEN** the tab SHALL render a guest-aware state with clear context and a login CTA instead of displaying device-local favorite content

#### Scenario: Logged-in user has no saved items
- **WHEN** the user is logged in but has no items for the selected favorites type
- **THEN** the tab SHALL render an empty state that keeps the favorites context and current type selection visible
