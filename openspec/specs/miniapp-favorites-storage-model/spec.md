## ADDED Requirements

### Requirement: Favorites storage SHALL use a normalized shared record model
Favorites storage SHALL persist notice records in a normalized local record model that can be reused by favorites lists and by page-local favorite actions.

#### Scenario: Favorite record is saved
- **WHEN** a notice is added to favorites
- **THEN** the stored record SHALL contain the normalized fields required for favorites grouping, rendering, and deduplication

#### Scenario: Favorite record is removed
- **WHEN** a notice is removed from favorites
- **THEN** the same normalized identifier model SHALL be used to remove it consistently from shared storage

### Requirement: Favorites storage SHALL persist selection context
Favorites storage SHALL preserve the user’s current favorites-type selection across re-entry.

#### Scenario: User leaves and returns to favorites
- **WHEN** the user re-enters the favorites tab
- **THEN** the surface SHALL restore the last selected favorites type from shared storage

### Requirement: Favorites storage updates SHALL be observable across surfaces
Changes to favorites storage SHALL be reflected when a related page re-enters or refreshes its local state.

#### Scenario: Favorite changes on another page
- **WHEN** a page-local favorite action changes the shared storage model
- **THEN** the favorites tab SHALL be able to reflect that change on re-entry or refresh without relying on a separate custom record format
