## MODIFIED Requirements

### Requirement: Home SHALL expose state-specific control composition
The home page SHALL present search, tabs, and filter controls according to the active business state, and those controls SHALL use a state-aware visual composition that distinguishes channel navigation, secondary switching, announcement-type switching, search, and filters instead of rendering them all as one repeated segmented-control language.

#### Scenario: Engineering state
- **WHEN** the user is in the engineering home state
- **THEN** the home page SHALL present the engineering-specific control composition with distinct visual hierarchy between the primary channel, secondary controls, announcement-type switch, search, and filters

#### Scenario: Procurement state
- **WHEN** the user is in a procurement home state
- **THEN** the home page SHALL present the procurement-specific control composition in the redesigned control language instead of reusing the engineering layout or a generic repeated segmented-control stack

#### Scenario: Information state
- **WHEN** the user is in the information state
- **THEN** the home page SHALL present only the controls supported for information content and SHALL keep that state visually lighter than the denser procurement or engineering control compositions

### Requirement: Home overlays SHALL follow the visible control set
Only filters that are visible and supported in the active home state SHALL expose overlays or related interaction flows, and those overlays SHALL feel like part of the same redesigned home control family.

#### Scenario: Supported filter is opened
- **WHEN** the user activates a filter button that belongs to the current home state
- **THEN** the home page SHALL present the corresponding overlay in the accepted hierarchy for that state and with a visual style that matches the redesigned home controls

#### Scenario: Unsupported filter is absent
- **WHEN** a filter does not belong to the active home state
- **THEN** the home page SHALL omit that filter and SHALL NOT expose its overlay through a hidden fallback path

