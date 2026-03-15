## ADDED Requirements

### Requirement: Primary-tab pages SHALL use a tab-page header family
Primary-tab pages SHALL use a lightweight header family that matches first-level navigation ownership instead of a secondary-page back-header pattern.

#### Scenario: Home tab page
- **WHEN** the user is on the home tab page
- **THEN** the header SHALL present the home title and content context without back navigation or duplicated first-level entry icons

#### Scenario: Favorites or profile tab page
- **WHEN** the user is on the favorites or profile tab page
- **THEN** the header SHALL follow the same tab-page family rather than switching to the older blue hero-style shell

### Requirement: Secondary pages SHALL use a back-navigation header family
Secondary pages SHALL use a header family centered on back navigation and page-local context.

#### Scenario: Form or status page
- **WHEN** the user is on login, register, or audit-status
- **THEN** the page SHALL render a secondary header with back navigation and a local page title

#### Scenario: Detail page with a page-local action
- **WHEN** the user is on a detail page that requires a local action such as favorite or share
- **THEN** the page SHALL use the secondary header family and keep that action scoped to the current page
