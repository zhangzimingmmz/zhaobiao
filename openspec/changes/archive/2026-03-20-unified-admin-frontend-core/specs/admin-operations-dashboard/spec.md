## ADDED Requirements

### Requirement: Dashboard summarizes pending operational work
The admin operations dashboard SHALL summarize the most important pending work for operators, including enterprise review backlog, recent crawl failures, and other high-priority reminders available at the time.

#### Scenario: Operator opens the dashboard
- **WHEN** an operator visits the dashboard
- **THEN** the page shows a consolidated summary of pending items instead of requiring the operator to enter each module separately

### Requirement: Dashboard shows platform freshness and health signals
The admin operations dashboard SHALL provide a first-screen view of platform freshness and health, including recent crawl activity, data freshness, and obvious abnormal states when those signals are available.

#### Scenario: Crawl freshness is visible
- **WHEN** freshness or recent-run data exists
- **THEN** the dashboard surfaces the latest known crawl timing and highlights stale or failed states

### Requirement: Dashboard provides shortcuts into core workflows
The admin operations dashboard SHALL provide direct navigation into the highest-frequency operator workflows, including enterprise review and crawl operations.

#### Scenario: Operator needs to act from the dashboard
- **WHEN** the dashboard shows a pending review queue or crawl issue
- **THEN** the page provides a direct path into the relevant module or detail view

### Requirement: Dashboard tolerates incomplete backend support
The admin operations dashboard SHALL remain a valid page even if some health widgets or summary cards are temporarily backed by placeholders, static copy, or partial data.

#### Scenario: A dashboard card lacks a supporting API
- **WHEN** a planned dashboard module does not yet have a dedicated API
- **THEN** the dashboard keeps the card position and displays a clear placeholder or partial-data state instead of removing the module from the information architecture
