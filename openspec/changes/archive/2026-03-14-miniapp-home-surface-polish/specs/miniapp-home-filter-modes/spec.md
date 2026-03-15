## ADDED Requirements

### Requirement: Home SHALL expose state-specific control composition
The home page SHALL present search, tabs, and filter controls according to the active business state instead of reusing one generic control layout.

#### Scenario: Engineering state
- **WHEN** the user is in the engineering home state
- **THEN** the home page SHALL present the engineering-specific control composition, including the supported secondary controls and filters for that state

#### Scenario: Procurement state
- **WHEN** the user is in a procurement home state
- **THEN** the home page SHALL present the procurement-specific control composition instead of reusing the engineering layout

#### Scenario: Information state
- **WHEN** the user is in the information state
- **THEN** the home page SHALL present only the controls supported for information content and SHALL NOT keep unrelated procurement or engineering controls visible

### Requirement: Home overlays SHALL follow the visible control set
Only filters that are visible and supported in the active home state SHALL expose overlays or related interaction flows.

#### Scenario: Supported filter is opened
- **WHEN** the user activates a filter button that belongs to the current home state
- **THEN** the home page SHALL present the corresponding overlay in the accepted hierarchy for that state

#### Scenario: Unsupported filter is absent
- **WHEN** a filter does not belong to the active home state
- **THEN** the home page SHALL omit that filter and SHALL NOT expose its overlay through a hidden fallback path
