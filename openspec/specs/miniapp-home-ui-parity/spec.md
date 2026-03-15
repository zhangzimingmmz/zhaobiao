# miniapp-home-ui-parity Specification

## Purpose
TBD - created by archiving change miniapp-home-ui-faithful. Update Purpose after archive.
## Requirements
### Requirement: Home page SHALL follow the `ui` reference by default
The miniapp home page SHALL use the `ui` home page as the default source of truth for visible structure, hierarchy, and interaction ordering.

#### Scenario: Engineering home state
- **WHEN** the user is in the engineering primary state and engineering secondary state
- **THEN** the miniapp SHALL present the same top-level structural order as the `ui` reference: top bar, primary tabs, secondary tabs, announcement-type controls, search, filter buttons, and list cards

#### Scenario: Government procurement state
- **WHEN** the user is in the government procurement primary state and switches between intention and announcement secondary states
- **THEN** the miniapp SHALL mirror the corresponding `ui` state layout rather than reusing an unrelated generic layout

#### Scenario: Information state
- **WHEN** the user is in the information primary state
- **THEN** the miniapp SHALL match the `ui` information-state hierarchy and avoid rendering controls that are absent from the `ui` reference for that state

### Requirement: Home overlays SHALL follow the `ui` interaction model by default
The miniapp home page SHALL present filter overlays and related transitions according to the `ui` home interaction model unless a documented platform exception applies.

#### Scenario: Time filter overlay
- **WHEN** the user opens the time filter from a home state that supports it
- **THEN** the miniapp SHALL present a bottom overlay with the same information hierarchy as the `ui` reference

#### Scenario: Region or source overlay
- **WHEN** the user opens a region or source filter from a supported home state
- **THEN** the miniapp SHALL present the overlay as part of the same home interaction model instead of degrading it into a visually unrelated picker flow


<!-- merged from miniapp-shell-navigation-reset -->

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
