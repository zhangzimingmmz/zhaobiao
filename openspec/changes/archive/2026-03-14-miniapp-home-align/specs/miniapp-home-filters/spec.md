## ADDED Requirements

### Requirement: Home filter bar renders by business state
The home page SHALL render different filter bar layouts based on the active business state.

#### Scenario: Engineering engineering state
- **WHEN** the active state is engineering primary tab plus engineering secondary tab
- **THEN** the filter bar shows the plan versus announcement segmented control, a search box, and time plus source filters

#### Scenario: Procurement intention state
- **WHEN** the active state is procurement primary tab plus intention secondary tab
- **THEN** the filter bar shows a search box plus time and region filters

#### Scenario: Procurement announcement state
- **WHEN** the active state is procurement primary tab plus announcement secondary tab
- **THEN** the filter bar shows a search box plus nature, method, time, and region filters

#### Scenario: Information state
- **WHEN** the active state is information display
- **THEN** the filter bar shows only a search box

### Requirement: Home filter controls use explicit sheet types
The home filter system SHALL support the `time`, `source`, `region`, `nature`, `method`, and `purchaser` sheet types.

#### Scenario: Time sheet opens
- **WHEN** the user taps the time filter button
- **THEN** the bottom sheet opens with quick ranges and a custom date-range section

#### Scenario: Source sheet opens
- **WHEN** the user taps the source filter button
- **THEN** the bottom sheet opens with an all option and Sichuan city or prefecture options

#### Scenario: Purchaser sheet opens
- **WHEN** the user taps the purchaser filter button
- **THEN** the bottom sheet opens with an input control for purchaser search
