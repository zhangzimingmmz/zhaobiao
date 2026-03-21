## ADDED Requirements

### Requirement: Favorites SHALL be a first-level tab surface
Favorites SHALL exist as a first-level destination with its own surface instead of relying on a page-local shortcut from another tab.

#### Scenario: Favorites tab is selected
- **WHEN** the user enters the favorites destination
- **THEN** the miniapp SHALL render a dedicated favorites tab surface rather than a placeholder or redirected home shortcut

#### Scenario: Favorites tab switches types
- **WHEN** the user changes the favorites type filter
- **THEN** the favorites surface SHALL update within the same tab context instead of routing to a separate page for each type

### Requirement: Favorites SHALL support guest and empty states explicitly
The favorites tab SHALL define explicit behavior for guests and for users with no saved items.

#### Scenario: Guest enters favorites
- **WHEN** the user is not logged in and enters the favorites tab
- **THEN** the tab SHALL render a guest-aware state with clear context and a login CTA instead of displaying device-local favorite content

#### Scenario: Logged-in user has no saved items
- **WHEN** the user is logged in but has no items for the selected favorites type
- **THEN** the tab SHALL render an empty state that keeps the favorites context and current type selection visible

### Requirement: Favorites tab SHALL read list data from the authenticated server API
The favorites tab SHALL load its item list from the authenticated server-side favorites API instead of from locally persisted favorite records.

#### Scenario: Logged-in favorites list loads successfully
- **WHEN** a logged-in user opens the favorites tab
- **THEN** the miniapp SHALL request the favorites list from the server and render the returned items

#### Scenario: Favorited source record has disappeared
- **WHEN** the server no longer resolves a previously favorited notice or article
- **THEN** that item SHALL not appear in the favorites tab list
