## MODIFIED Requirements

### Requirement: Primary-tab pages SHALL use a tab-page header family
Primary-tab pages SHALL use a restrained tab-page header family with a white or near-white background, compact title rhythm, and minimal chrome. That family SHALL match first-level navigation ownership without relying on a heavy blue hero bar or gradient title band.

#### Scenario: Home tab page
- **WHEN** the user is on the home tab page
- **THEN** the header SHALL present the home title and content context in the redesigned tab-page header language without back navigation or duplicated first-level entry icons

#### Scenario: Favorites or profile tab page
- **WHEN** the user is on the favorites or profile tab page
- **THEN** the header SHALL follow the same redesigned tab-page family rather than switching to an older generic shell

### Requirement: Secondary pages SHALL use a back-navigation header family
Secondary pages SHALL use a white back-navigation header family centered on page-local context, and that family SHALL remain visually distinct from the redesigned tab-page headers without introducing oversized color blocks for routine content pages.

#### Scenario: Form or status page
- **WHEN** the user is on login, register, or audit-status
- **THEN** the page SHALL render a secondary header with back navigation and a local page title

#### Scenario: Detail page with a page-local action
- **WHEN** the user is on a detail page that requires a local action such as favorite or share
- **THEN** the page SHALL use the secondary header family and keep that action scoped to the current page

#### Scenario: Channel page header is rendered
- **WHEN** the user opens a channel page that sits beneath the home entry page
- **THEN** the header SHALL follow the lighter secondary-page family rather than reusing a saturated tab-header treatment
