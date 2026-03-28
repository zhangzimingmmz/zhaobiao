## ADDED Requirements

### Requirement: Channel pages SHALL use a white-header list-page family
Engineering, government, and information channel pages SHALL share a dedicated list-page family with a white or near-white header, restrained back navigation, a local page title, and a clear separation between page header and filter controls. They SHALL NOT reuse a high-saturation tab-page hero bar for routine channel browsing.

#### Scenario: Channel page is rendered
- **WHEN** the user enters a channel page such as engineering, government, or information
- **THEN** the page SHALL use the white-header list-page family instead of a dominant blue tab-style header

#### Scenario: Channel page header is compared to home tab
- **WHEN** the home tab and a channel page are viewed side by side
- **THEN** the channel page SHALL remain visually distinct as a secondary list page with back navigation rather than reading like another primary tab shell

### Requirement: Channel control panels SHALL stay thin and tool-like
Channel-page control panels SHALL present secondary tabs, search, and filters as a compact tool strip with restrained borders, lower visual weight, and tighter spacing. The control area SHALL NOT degrade into a large nested-card panel.

#### Scenario: Channel control panel is rendered
- **WHEN** a channel page displays its tabs, search box, and filter buttons
- **THEN** the control panel SHALL read as one compact tool area with thin controls and restrained spacing

#### Scenario: Channel control density is evaluated
- **WHEN** the page is visually reviewed against the target PDF
- **THEN** the search box, tab pills, and filter buttons SHALL appear flatter and tighter than the current card-like implementation

### Requirement: Channel list and empty states SHALL preserve compact reading rhythm
The list area, empty state, and load-more behavior of channel pages SHALL preserve a compact reading rhythm that keeps attention on titles and supported metadata. The page SHALL avoid oversized card shells or blank-state blocks that overpower the content area.

#### Scenario: Channel list contains data
- **WHEN** a channel page renders one or more records
- **THEN** the cards SHALL maintain a compact vertical rhythm that keeps titles, tags, source, and publish time visually grouped

#### Scenario: Channel page has no records
- **WHEN** the active channel state returns no data
- **THEN** the empty state SHALL appear within the channel-page family as a restrained content-state message rather than as a large generic white board
