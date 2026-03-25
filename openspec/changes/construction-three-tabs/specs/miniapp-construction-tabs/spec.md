## ADDED Requirements

### Requirement: Construction board SHALL present three switchable tabs
The construction board SHALL present three secondary tabs for users to switch between different types of construction notices: tender plan (招标计划), tender document preview (招标文件预公示), and tender announcement (招标公告).

#### Scenario: User enters construction board
- **WHEN** user selects the construction primary tab
- **THEN** the system SHALL display three secondary tabs: "招标计划", "招标文件预公示", "招标公告"
- **AND** the system SHALL default to the first tab (招标计划)

#### Scenario: User switches between tabs
- **WHEN** user clicks on a different secondary tab
- **THEN** the system SHALL update the active tab state
- **AND** the system SHALL fetch and display notices for the selected category

### Requirement: Each tab SHALL map to a specific category
Each secondary tab SHALL correspond to a specific notice category code for API requests.

#### Scenario: Tender plan tab selected
- **WHEN** user selects "招标计划" tab
- **THEN** the system SHALL use category code "002001009" for API requests

#### Scenario: Tender document preview tab selected
- **WHEN** user selects "招标文件预公示" tab
- **THEN** the system SHALL use category code "002001010" for API requests

#### Scenario: Tender announcement tab selected
- **WHEN** user selects "招标公告" tab
- **THEN** the system SHALL use category code "002001001" for API requests

### Requirement: Tab configuration SHALL be defined in SECONDARY_MAP
The construction board's tab configuration SHALL be defined in the SECONDARY_MAP constant with proper id and label mappings.

#### Scenario: SECONDARY_MAP contains construction tabs
- **WHEN** the system initializes
- **THEN** SECONDARY_MAP.construction SHALL contain three tab objects
- **AND** each tab object SHALL have an id field (plan, preview, announcement)
- **AND** each tab object SHALL have a label field with Chinese text

### Requirement: Section title SHALL be removed
The fixed section title "招标文件预公示" that appears below the primary tabs SHALL be removed when construction board has secondary tabs.

#### Scenario: Construction board with tabs
- **WHEN** user is on construction board
- **AND** secondary tabs are displayed
- **THEN** the system SHALL NOT display the fixed section title
- **AND** the secondary tabs SHALL serve as the navigation mechanism
