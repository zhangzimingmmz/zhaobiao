## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL use a shared auth-page family built on the secondary-page header and the miniapp's existing white-blue card system, while allowing each page to keep a task-specific layout.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family
- **THEN** the page SHALL present a brand header and a dominant login card using the auth-family shell
- **THEN** the page SHALL visually align with the miniapp's global tokens for background, card chrome, button styling, and text hierarchy

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same auth-page family
- **THEN** the register page SHALL allow a longer scrollable form while preserving the shared brand header, card language, and primary action treatment

### Requirement: Auth pages SHALL preserve their required entry actions
The auth-page family SHALL preserve login, registration, agreement, and audit-status actions while keeping the primary task of each page visually dominant over supporting information.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose login fields, submission CTA, registration entry, and agreement messaging inside the auth-family shell
- **THEN** the login submission CTA SHALL remain the strongest action on the page

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose the required enterprise-registration fields and the submission CTA inside the auth-family shell
- **THEN** non-form explanatory text SHALL remain secondary to the registration form itself

#### Scenario: Audit status is shown
- **WHEN** the audit-status page is displayed
- **THEN** the page SHALL expose the current status, supporting information, and the appropriate next action inside the same auth-family shell
- **THEN** the status outcome SHALL remain visually dominant over supporting metadata
