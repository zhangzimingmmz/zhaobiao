## ADDED Requirements

### Requirement: Bid detail favorite state is persistent
The bid detail page SHALL persist favorite state using the shared favorites storage contract.

#### Scenario: Detail opens for an already-favorited record
- **WHEN** the user opens a bid detail record that already exists in favorites storage
- **THEN** the page shows the favorite action in the favorited state

#### Scenario: User favorites a bid detail record
- **WHEN** the user toggles favorite on for the current bid detail record
- **THEN** the page writes a normalized favorite record to shared favorites storage

#### Scenario: User removes a bid detail record from favorites
- **WHEN** the user toggles favorite off for the current bid detail record
- **THEN** the page removes that record from shared favorites storage
