## ADDED Requirements

### Requirement: Login page SHALL show a guest preview carousel with the latest real records
The login page SHALL show a guest preview carousel beneath the primary login form, and that carousel SHALL request, de-duplicate, and render up to the latest 10 real records as a teaser for the product content.

#### Scenario: Login page loads preview records
- **WHEN** the user enters the login page without being authenticated
- **THEN** the page SHALL request preview records from the configured real data sources
- **THEN** the page SHALL sort and de-duplicate those records by recency
- **THEN** the page SHALL render up to 10 real records without fabricating placeholder data

#### Scenario: Fewer than ten records exist
- **WHEN** fewer than 10 previewable real records are available
- **THEN** the page SHALL render the available records without inventing additional teaser items

### Requirement: Guest preview cards SHALL use BidCard-like information order with a restricted field set
Each guest preview card SHALL behave as a `BidCard Lite`: it SHALL follow the same reading order as the formal notice cards while only showing a restricted field set suitable for the login-page teaser.

#### Scenario: Guest preview card is rendered
- **WHEN** a guest preview record is shown in the carousel
- **THEN** the card SHALL display title, category label, source, and publish time in that order
- **THEN** the card SHALL visually read as a light version of the formal bid-information card rather than as a generic teaser block

#### Scenario: Full business fields exist in the source record
- **WHEN** the source record also contains richer data such as purchaser, region, deadline, budget, or favorite state
- **THEN** the guest preview card SHALL NOT render those richer fields in the login-page teaser

### Requirement: Guest preview carousel SHALL show one message-card-style teaser per page while remaining login-gated
The guest preview carousel SHALL present records as a single-card carousel with one teaser per page, while continuing to behave as a login-gated teaser rather than an anonymous content entry point.

#### Scenario: Guest preview carousel paginates records
- **WHEN** multiple preview records are available
- **THEN** the carousel SHALL group records into pages of one card each
- **THEN** each page SHALL present a compact message-card-style teaser that keeps the formal bid-card reading order while fitting the login-page footer band

#### Scenario: Guest taps a preview card
- **WHEN** an unauthenticated user taps any preview card
- **THEN** the miniapp SHALL show a prompt telling the user to log in before viewing details
- **THEN** the miniapp SHALL NOT navigate to detail pages, channel pages, or other full data surfaces from that interaction
