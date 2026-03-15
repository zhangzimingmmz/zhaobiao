## ADDED Requirements

### Requirement: Favorites page lists saved items by type
The miniapp SHALL provide a dedicated favorites page that lists saved records grouped by favorite type.

#### Scenario: User opens the favorites page
- **WHEN** the user navigates to the favorites page
- **THEN** the page shows a favorites list filtered by the currently selected type tab

#### Scenario: User switches favorites type
- **WHEN** the user taps a different favorites type tab
- **THEN** the page updates the list to show only records belonging to that type

### Requirement: Favorites page shows an empty state
The favorites page SHALL show an empty state when the selected type has no saved records.

#### Scenario: Selected type has no favorites
- **WHEN** there are no saved favorites for the active type
- **THEN** the page shows an empty-state message and a path back to browsing
