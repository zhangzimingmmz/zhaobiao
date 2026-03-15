## ADDED Requirements

### Requirement: Loading states SHALL preserve home-state rhythm
The home page SHALL show loading states that preserve the visible rhythm of the active home state instead of collapsing to a generic placeholder.

#### Scenario: Bid-oriented state is loading
- **WHEN** the active home state is a bid-oriented list and results are still loading
- **THEN** the loading skeleton SHALL mirror the accepted bid-card rhythm for that state

#### Scenario: Information state is loading
- **WHEN** the active home state is the information list and results are still loading
- **THEN** the loading presentation SHALL mirror the accepted information-card rhythm for that state

### Requirement: Empty states SHALL respect current context
Empty states SHALL preserve the active state context and explain the absence of results without resetting the page structure.

#### Scenario: Filters produce no results
- **WHEN** the current home state has active filters but no matching results
- **THEN** the empty state SHALL appear inside the active home structure and retain the user's current state selection

#### Scenario: State has no content yet
- **WHEN** a supported home state has no records available
- **THEN** the page SHALL present a state-appropriate empty state rather than falling back to a generic blank page
