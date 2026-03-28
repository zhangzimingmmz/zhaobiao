## ADDED Requirements

### Requirement: Login page SHALL show a guest preview carousel with real data
The login page SHALL show a guest preview carousel beneath the primary login form, and that carousel SHALL display exactly 5 real records as a teaser for the product content.

#### Scenario: Login page loads preview records
- **WHEN** the user enters the login page without being authenticated
- **THEN** the page SHALL request and render up to 5 real preview records for the guest carousel

#### Scenario: Fewer than five records exist
- **WHEN** fewer than 5 previewable real records are available
- **THEN** the page SHALL render the available records without fabricating placeholders as fake data

### Requirement: Guest preview cards SHALL use a restricted field set
Each guest preview card SHALL only display a restricted teaser field set: title, publish time, source, and category label.

#### Scenario: Guest preview card is rendered
- **WHEN** a guest preview record is shown in the carousel
- **THEN** the card SHALL display title, publish time, source, and category label only

#### Scenario: Full business fields exist in the source record
- **WHEN** the source record also contains richer data such as budget, deadline, or additional metadata
- **THEN** the guest preview card SHALL NOT render those richer fields in the login-page teaser

### Requirement: Guest preview interaction SHALL remain login-gated
The guest preview carousel SHALL behave as a login-gated teaser rather than an anonymous content entry point.

#### Scenario: Guest taps a preview card
- **WHEN** an unauthenticated user taps any preview card
- **THEN** the miniapp SHALL show a prompt telling the user to log in before viewing details

#### Scenario: Guest tries to use preview as content navigation
- **WHEN** an unauthenticated user interacts with the guest preview area
- **THEN** the miniapp SHALL NOT navigate to detail pages, channel pages, or other full data surfaces from that interaction
