## ADDED Requirements

### Requirement: Minimal admin frontend provides a crawl console
The system SHALL provide a crawl console page where the operator can view allowed crawl actions, fill required parameters, and submit a run request.

#### Scenario: Operator prepares a crawl action
- **WHEN** the operator opens the crawl console
- **THEN** the page shows the allowed action set and allows required parameters to be entered before submission

### Requirement: Minimal admin frontend provides a run history page
The system SHALL provide a run history page that shows historical crawl runs and their current status.

#### Scenario: Operator checks run history
- **WHEN** the operator opens the run history page
- **THEN** the page shows the run list from the crawl run history admin interface

### Requirement: Minimal admin frontend provides a run detail page
The system SHALL provide a run detail page that shows action parameters, execution summary, status, and failure reason for a selected run.

#### Scenario: Operator investigates a run
- **WHEN** the operator opens a run detail record
- **THEN** the page shows the available summary and failure context returned by the backend
