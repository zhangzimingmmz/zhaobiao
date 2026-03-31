## ADDED Requirements

### Requirement: Register page SHALL remain a standalone registration entry
The miniapp register page SHALL open as a usable registration form without automatically querying or restoring a previous application state from device-local registration cache.

#### Scenario: User opens register page on a device that has previous registration cache
- **WHEN** the device still contains a previous `applicationId`, `username`, or `mobile` from another registration attempt
- **THEN** the register page SHALL still render the registration form directly
- **THEN** the page SHALL NOT automatically redirect to the audit-status page or the login page before the user performs an explicit action

#### Scenario: User wants to register another account on the same device
- **WHEN** a user opens the register page after another account has already registered on the same phone
- **THEN** the page SHALL behave as a fresh registration entry
- **THEN** the user SHALL be able to fill and submit a different username and mobile combination without first clearing device-local progress manually

### Requirement: Register success feedback SHALL not permanently bind later register-page visits
The register flow MAY preserve minimal local context for the immediate post-submit experience, but SHALL NOT use that context to control future register-page entry behavior.

#### Scenario: Registration submission succeeds
- **WHEN** the user submits a valid registration request and the backend returns success
- **THEN** the miniapp SHALL provide immediate success feedback and the configured next step for that submission
- **THEN** any locally stored registration context SHALL be treated as short-lived flow context rather than as a long-term gate for later visits to the register page
