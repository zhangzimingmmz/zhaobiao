## ADDED Requirements

### Requirement: Minimal admin frontend is a dedicated project
The system SHALL implement the operations backend as a dedicated `admin-frontend` project inside the current repository, separate from `miniapp`, `server`, and `crawler`.

#### Scenario: Repository structure is established
- **WHEN** the minimal admin frontend is created
- **THEN** it exists as a clearly named dedicated backend frontend project rather than reusing any retired sample frontend

### Requirement: Minimal admin frontend only includes eight first-phase pages
The system SHALL limit the first implementation phase to exactly eight pages: login, dashboard, enterprise review list, enterprise review detail, company directory, crawl console, run history list, and run detail.

#### Scenario: A developer checks the first-phase scope
- **WHEN** a developer reads the minimal admin frontend scope
- **THEN** the page list does not include extra pages such as company detail, settings, reporting, or messaging

### Requirement: Minimal admin shell stays lightweight
The system SHALL provide only a basic shell with simple navigation, a page title area, and basic loading, empty, and error states.

#### Scenario: Operator enters the backend after login
- **WHEN** the operator opens a backend page
- **THEN** the page is rendered inside a lightweight shell without requiring advanced platform features such as global search or complex environment controls

### Requirement: Minimal admin routes require login
The system SHALL require a successful admin login before an operator can access any protected backend page.

#### Scenario: User opens a backend route without login
- **WHEN** a user visits a protected backend route without a stored admin session
- **THEN** the frontend redirects the user to the admin login page
