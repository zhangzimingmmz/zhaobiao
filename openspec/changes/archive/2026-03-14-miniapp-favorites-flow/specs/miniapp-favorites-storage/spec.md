## ADDED Requirements

### Requirement: Favorite records are stored in a shared local format
The miniapp SHALL persist favorite records in a shared local storage format that can be reused by the favorites page and detail page.

#### Scenario: Favorite is saved
- **WHEN** a page saves a record as a favorite
- **THEN** the record is written to local storage with a stable favorite type and the minimum fields needed to render it later

#### Scenario: Favorites are restored after restart
- **WHEN** the user reopens the miniapp
- **THEN** the favorites page can read the saved favorites from local storage and render them without refetching

### Requirement: Selected favorites type is persisted
The miniapp SHALL persist the user's selected favorites type.

#### Scenario: User reopens favorites page
- **WHEN** the user returns to the favorites page after previously selecting a type
- **THEN** the page restores the last selected favorites type from local storage
