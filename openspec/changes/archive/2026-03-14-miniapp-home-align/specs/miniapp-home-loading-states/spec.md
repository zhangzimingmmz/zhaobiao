## ADDED Requirements

### Requirement: Home bid lists use skeleton loading
The home page SHALL show bid-card skeleton placeholders while a bid list is loading.

#### Scenario: Bid list is loading
- **WHEN** the home page is loading a bid list
- **THEN** the page renders repeated skeleton cards instead of a generic loading empty state

#### Scenario: Bid list finishes loading
- **WHEN** the list request resolves
- **THEN** the skeleton cards disappear and the real bid cards or empty state render
