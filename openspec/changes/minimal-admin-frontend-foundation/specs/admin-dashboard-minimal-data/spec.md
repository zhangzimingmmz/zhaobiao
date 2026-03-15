## ADDED Requirements

### Requirement: Dashboard shows pending review count
The system SHALL provide the minimal dashboard with a pending enterprise review count.

#### Scenario: Operator opens the dashboard
- **WHEN** the operator enters the dashboard page
- **THEN** the page shows the current pending review count using either a dedicated dashboard interface or an allowed frontend aggregation of existing admin interfaces

### Requirement: Dashboard shows recent crawl run status
The system SHALL provide the minimal dashboard with a recent crawl run summary or most recent run status.

#### Scenario: Operator checks the latest crawl condition
- **WHEN** the operator opens the dashboard page
- **THEN** the page shows the latest known crawl run state using either a dedicated dashboard interface or an allowed frontend aggregation of existing admin interfaces

### Requirement: Dashboard data source strategy is explicit
The system SHALL explicitly document whether the dashboard is backed by a dedicated backend interface or by frontend aggregation of existing admin interfaces.

#### Scenario: Developers wire the dashboard
- **WHEN** the team starts implementing the dashboard
- **THEN** the team can determine from the specification whether a dedicated backend dashboard interface is required or whether frontend aggregation is intentionally permitted
