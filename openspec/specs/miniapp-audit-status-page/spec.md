## ADDED Requirements

### Requirement: Audit-status SHALL express pending, approved, and rejected outcomes clearly
The audit-status page SHALL present its outcomes as explicit state presentations rather than as a minor variation of the old registration shell.

#### Scenario: Pending audit
- **WHEN** the current audit status is pending
- **THEN** the page SHALL communicate progress and waiting context through the accepted status-page treatment

#### Scenario: Approved or rejected audit
- **WHEN** the audit status is approved or rejected
- **THEN** the page SHALL present the outcome, relevant supporting information, and the appropriate next action for that state

### Requirement: Audit-status SHALL remain in the secondary-page family
The audit-status page SHALL use the shared secondary-page header and spacing rules instead of reverting to the retired blue shell.

#### Scenario: Audit-status page is rendered
- **WHEN** the user opens the audit-status page
- **THEN** the page SHALL behave like a secondary page with back navigation and local status content rather than like a first-level tab page
