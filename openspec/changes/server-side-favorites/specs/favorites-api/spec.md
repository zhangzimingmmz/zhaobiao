## ADDED Requirements

### Requirement: Favorites API SHALL persist user-to-content relationships

The system SHALL persist favorites as authenticated user relationships to content targets instead of device-local records.

#### Scenario: User favorites a bid notice

- **WHEN** an authenticated user favorites a bid notice
- **THEN** the system SHALL save a relationship containing `user_id`, `target_type=bid`, `target_id`, and the notice site identifier

#### Scenario: User favorites an info article

- **WHEN** an authenticated user favorites an info article
- **THEN** the system SHALL save a relationship containing `user_id`, `target_type=info`, and `target_id`

### Requirement: Favorites toggle SHALL require authentication

The favorites toggle endpoint SHALL reject unauthenticated requests.

#### Scenario: Guest toggles favorite

- **WHEN** a request to toggle favorite is sent without a valid user token
- **THEN** the system SHALL return an unauthenticated response instead of creating device-local fallback data

#### Scenario: Authenticated user toggles favorite

- **WHEN** a request to toggle favorite is sent with a valid user token
- **THEN** the system SHALL either create or remove the corresponding relationship and return the final `favorited` state

### Requirement: Favorites relationships SHALL be unique per user and target

The system SHALL prevent duplicate favorites for the same authenticated user and the same target.

#### Scenario: User favorites the same target twice

- **WHEN** the same authenticated user favorites the same target again
- **THEN** the system SHALL not create a duplicate relationship row

#### Scenario: Different users favorite the same target

- **WHEN** two different authenticated users favorite the same target
- **THEN** the system SHALL persist separate relationships for each user

### Requirement: Favorites list SHALL return only still-valid source records

The favorites list endpoint SHALL return only favorites whose underlying notice or article record still exists and is still listable.

#### Scenario: Favorited source record still exists

- **WHEN** the underlying notice or article record still exists
- **THEN** the favorites list SHALL include that item with the fields required for favorites rendering

#### Scenario: Favorited source record has disappeared

- **WHEN** the underlying notice or article record can no longer be found
- **THEN** the favorites list SHALL omit that favorite item instead of returning a stale snapshot

### Requirement: Favorites API SHALL expose server-truth favorited status

The system SHALL provide a stable way for the miniapp to resolve whether the current authenticated user has favorited a target.

#### Scenario: Authenticated user requests favorite status

- **WHEN** the miniapp needs the current favorite state for a target
- **THEN** the system SHALL return whether the current authenticated user has favorited that target based on server data
