## ADDED Requirements

### Requirement: Admin frontend provides a crawl action console
The admin frontend SHALL provide a crawl operations console where operators can discover supported crawl actions and submit allowed actions with parameters.

#### Scenario: Operator prepares a crawl action
- **WHEN** an operator opens the crawl operations console
- **THEN** the page shows the supported action set and a parameter entry experience for actions that are allowed from the admin frontend

### Requirement: Admin frontend provides run history
The admin frontend SHALL provide a run history view for crawl operations so operators can inspect recent and historical execution attempts by site, action, and status.

#### Scenario: Operator inspects previous runs
- **WHEN** an operator visits the run history view
- **THEN** the system shows a list of crawl runs with enough metadata to understand what ran, when it ran, and whether it succeeded or failed

### Requirement: Admin frontend provides run detail and failure context
The admin frontend SHALL provide a run detail view that exposes execution summary, status, parameters, and failure context such as log tail or rejection reason when available.

#### Scenario: Operator investigates a failed run
- **WHEN** an operator opens a failed or rejected run record
- **THEN** the page shows the available execution summary and failure context needed to understand the issue

### Requirement: Crawl operations pages support partial backend coverage
The admin frontend SHALL support crawl control pages even when some actions, fields, or health extensions are not yet fully backed by APIs.

#### Scenario: Planned crawl metadata is not yet available
- **WHEN** a crawl page expects fields or actions that are not yet implemented server-side
- **THEN** the page preserves the planned layout and communicates that the section is unavailable, restricted, or pending backend support
