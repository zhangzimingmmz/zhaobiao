## MODIFIED Requirements

### Requirement: Home page SHALL follow the `ui` reference by default
The miniapp home page SHALL use the `ui` home page as the default source of truth for the home content surface, while the global shell and first-level navigation model SHALL follow the accepted miniapp primary-navigation structure.

#### Scenario: Engineering home state
- **WHEN** the user is in the engineering primary state and engineering secondary state
- **THEN** the miniapp SHALL present the same home-content structural order as the `ui` reference within the accepted primary shell: primary tabs, secondary tabs, announcement-type controls, search, filter buttons, and list cards

#### Scenario: Government procurement state
- **WHEN** the user is in the government procurement primary state and switches between intention and announcement secondary states
- **THEN** the miniapp SHALL mirror the corresponding `ui` home-content layout within the accepted primary shell rather than reusing an unrelated generic layout

#### Scenario: Information state
- **WHEN** the user is in the information primary state
- **THEN** the miniapp SHALL match the `ui` information-state hierarchy inside the accepted primary shell and avoid rendering controls that are absent from the `ui` reference for that state
