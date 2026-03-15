## ADDED Requirements

### Requirement: Backend provides fixed-credential admin login
The system SHALL provide a backend admin login interface that validates a fixed username and password for the single operator of the minimal admin frontend.

#### Scenario: Correct admin credentials are submitted
- **WHEN** the operator submits the configured admin username and password
- **THEN** the backend returns a valid admin authentication result that can be stored by the frontend

### Requirement: Backend rejects invalid admin credentials
The system SHALL reject invalid admin username or password submissions with a clear failure response.

#### Scenario: Incorrect admin password is submitted
- **WHEN** the operator submits an incorrect admin password
- **THEN** the backend returns a failure response that prevents backend access

### Requirement: Frontend stores admin login locally for long-lived access
The system SHALL allow the admin frontend to persist the successful login result locally so the single operator remains logged in until browser storage is cleared.

#### Scenario: Operator refreshes the browser after login
- **WHEN** the operator refreshes the browser after a successful admin login
- **THEN** the admin frontend restores the local admin session without requiring immediate re-login
