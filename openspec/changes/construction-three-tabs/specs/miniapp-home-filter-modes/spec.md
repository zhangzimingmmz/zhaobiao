## MODIFIED Requirements

### Requirement: Home SHALL expose state-specific control composition
The home page SHALL present search, tabs, and filter controls according to the active business state, and those controls SHALL use a state-aware visual composition that distinguishes channel navigation, secondary switching, announcement-type switching, search, and filters instead of rendering them all as one repeated segmented-control language.

#### Scenario: Engineering state
- **WHEN** the user is in the engineering home state
- **THEN** the home page SHALL present the engineering-specific control composition with distinct visual hierarchy between the primary channel, secondary tabs (招标计划/招标文件预公示/招标公告), search, and filters
- **AND** the system SHALL NOT display a fixed section title when secondary tabs are present

#### Scenario: Procurement state
- **WHEN** the user is in a procurement home state
- **THEN** the home page SHALL present the procurement-specific control composition in the redesigned control language instead of reusing the engineering layout or a generic repeated segmented-control stack

#### Scenario: Information state
- **WHEN** the user is in the information state
- **THEN** the home page SHALL present only the controls supported for information content and SHALL keep that state visually lighter than the denser procurement or engineering control compositions
