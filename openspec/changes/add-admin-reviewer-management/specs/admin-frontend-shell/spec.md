## MODIFIED Requirements

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
