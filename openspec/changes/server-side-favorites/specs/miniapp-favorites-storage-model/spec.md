## MODIFIED Requirements

### Requirement: Favorites storage SHALL use a server-backed authenticated model

Favorites storage SHALL use the authenticated server-side favorites model as its primary source of truth. The miniapp MUST NOT persist favorites records in device-local storage as the authoritative dataset.

#### Scenario: Logged-in user favorites a notice

- **WHEN** a logged-in user adds a notice to favorites
- **THEN** the miniapp SHALL persist that favorite through the server-side favorites API rather than by writing a full local record set as the source of truth

#### Scenario: Favorite record is removed

- **WHEN** a logged-in user removes a notice from favorites
- **THEN** the miniapp SHALL remove that relationship through the server-side favorites API using the same target identifier model

### Requirement: Favorites storage SHALL persist selection context

Favorites storage SHALL preserve the user’s current favorites-type selection across re-entry.

#### Scenario: User leaves and returns to favorites

- **WHEN** the user re-enters the favorites tab
- **THEN** the surface SHALL restore the last selected favorites type from shared storage

### Requirement: Favorites state SHALL refresh from server truth across surfaces

Changes to favorites state SHALL be reflected across related surfaces based on refreshed server data rather than a shared local favorite-record cache.

#### Scenario: Favorite changes on another page

- **WHEN** a page-local favorite action changes the authenticated server-side favorites state
- **THEN** the favorites tab SHALL be able to reflect that change on re-entry or refresh by reloading server data
