## ADDED Requirements

### Requirement: Channel pages SHALL use a light list-page density family
Channel pages SHALL present their list tools and records as a lightweight secondary-page list surface rather than as stacked heavy cards. The accepted structure SHALL be a single secondary header, one grouped tool strip, and a denser list of notice cards.

#### Scenario: Channel page renders with available controls
- **WHEN** a user opens `工程建设`、`政府采购` or `信息公开`
- **THEN** the page SHALL render one secondary header, one grouped control strip for tab/search/filter actions, and the notice list directly beneath it without inserting an additional title block or explanatory section

#### Scenario: Channel page renders on tall screens
- **WHEN** a channel page is displayed on a tall mobile viewport
- **THEN** the layout SHALL preserve a compact vertical rhythm through lighter control density and denser list cards instead of relying on oversized header or control blocks

### Requirement: Channel tools SHALL behave as a compact tool strip
The channel tab selector, search input, and list filter buttons SHALL appear as a coordinated tool strip with reduced control height, reduced outer padding, and minimal card framing.

#### Scenario: Tool strip is rendered
- **WHEN** a channel page shows tabs, search, and filter buttons
- **THEN** the controls SHALL share one light grouping treatment and SHALL avoid the visual weight of a large standalone white panel card

#### Scenario: Search and filter controls are visible
- **WHEN** search and filter controls are idle
- **THEN** their default presentation SHALL remain lighter and thinner than primary action buttons while preserving readability and tappable affordance
