## ADDED Requirements

### Requirement: Admin frontend provides a unified shell
The admin frontend SHALL provide a unified application shell with a persistent navigation structure so operators can move between core modules without losing context. The shell MUST expose stable navigation for dashboard, enterprise management, content management, crawl control, operations settings, and run records. The shell MUST also support role-aware access to protected settings sub-features such as reviewer management.

#### Scenario: Super administrator enters the admin frontend
- **WHEN** a `super_admin` opens the admin frontend
- **THEN** the system shows the unified shell with the core navigation structure
- **AND** the shell provides an entry path to reviewer management within operations settings

#### Scenario: Reviewer enters the admin frontend
- **WHEN** a `reviewer` opens the admin frontend
- **THEN** the system shows the same unified shell for shared modules
- **AND** the shell hides the reviewer-management entry or renders it inaccessible

### Requirement: Admin frontend defines standard global states
The admin frontend SHALL define standard loading, empty, error, unauthorized, and API-unavailable states that can be reused by every page.

#### Scenario: Backend data is temporarily unavailable
- **WHEN** a page depends on an unavailable or incomplete API
- **THEN** the page shows a standard fallback state that explains whether the page is waiting for data, has no data, or cannot be accessed

### Requirement: Admin frontend marks environment and access context
The admin frontend SHALL display the current environment and access context in the shell so operators can distinguish internal, test, and production use.

#### Scenario: Operator uses a non-production environment
- **WHEN** an operator accesses the admin frontend in a test or internal environment
- **THEN** the shell visibly marks the environment to reduce accidental operations in the wrong context

### Requirement: Admin frontend reserves an authenticated entry path
The admin frontend SHALL define a formal authenticated entry path and route-guard model even if the first implementation uses a lightweight internal authentication mechanism.

#### Scenario: Unauthenticated access reaches a protected page
- **WHEN** a user opens a protected admin route without a valid admin session
- **THEN** the system redirects the user to the defined admin entry path or shows an unauthorized state
