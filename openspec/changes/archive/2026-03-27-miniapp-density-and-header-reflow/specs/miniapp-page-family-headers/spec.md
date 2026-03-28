## MODIFIED Requirements

### Requirement: Primary-tab pages SHALL use a tab-page header family
Primary-tab pages SHALL use a lightweight but branded header family that matches first-level navigation ownership instead of a secondary-page back-header pattern or a purely utilitarian title row. That family SHALL hand off quickly to page-local content and SHALL NOT leave oversized inert gaps between the tab header and the page’s first meaningful section.

#### Scenario: Home tab page
- **WHEN** the user is on the home tab page
- **THEN** the header SHALL present the home title and content context in the redesigned tab-page header language without back navigation or duplicated first-level entry icons

#### Scenario: Favorites or profile tab page
- **WHEN** the user is on the favorites or profile tab page
- **THEN** the header SHALL follow the same redesigned tab-page family while still allowing each page to expose its own local first section immediately beneath the header

### Requirement: Secondary pages SHALL use a back-navigation header family
Secondary pages SHALL use a header family centered on back navigation and page-local context, and that family SHALL remain visually distinct from the redesigned tab-page headers. Secondary pages SHALL expose only one effective title layer for the current page context and SHALL NOT stack duplicate body titles beneath the header.

#### Scenario: Form or status page
- **WHEN** the user is on login, register, or audit-status
- **THEN** the page SHALL render a secondary header with back navigation and a local page title

#### Scenario: Detail page with a page-local action
- **WHEN** the user is on a detail page that requires a local action such as favorite or share
- **THEN** the page SHALL use the secondary header family and keep that action scoped to the current page

#### Scenario: Channel page uses a secondary header
- **WHEN** the user opens a channel page beneath the home entry page
- **THEN** the page SHALL use the secondary header family without duplicating the channel title again as a second full title block below the header
