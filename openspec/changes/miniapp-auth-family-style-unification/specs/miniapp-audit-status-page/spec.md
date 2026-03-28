## MODIFIED Requirements

### Requirement: Audit-status SHALL express pending, approved, and rejected outcomes clearly
The audit-status page SHALL present pending, approved, rejected, and not-found outcomes as a single status-card experience inside the auth-page family, rather than as a separate intro block plus loosely related content panels.

#### Scenario: Pending audit
- **WHEN** the current audit status is pending
- **THEN** the page SHALL show the pending state, progress steps, and waiting context inside the status card
- **THEN** the card SHALL make the next user action clear without visually competing with supporting data

#### Scenario: Approved or rejected audit
- **WHEN** the audit status is approved or rejected
- **THEN** the page SHALL present the outcome, supporting information, and the appropriate next action inside the status card
- **THEN** rejected states SHALL keep the reject reason visually distinct without changing the overall page family

#### Scenario: No application found
- **WHEN** no registration application is found
- **THEN** the page SHALL present a not-found state and its next action inside the same status-card treatment

### Requirement: Audit-status SHALL remain in the secondary-page family
The audit-status page SHALL remain in the secondary-page header family while adopting the auth-page family's brand header, card chrome, and primary action treatment.

#### Scenario: Audit-status page is rendered
- **WHEN** the user opens the audit-status page
- **THEN** the page SHALL behave like a secondary page with back navigation
- **THEN** the page SHALL display a lighter auth-family brand header above the status card
- **THEN** the page SHALL use the same button, card, and text hierarchy rules as the login and register pages
