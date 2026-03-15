## ADDED Requirements

### Requirement: The miniapp SHALL expose three first-level destinations
The miniapp SHALL use three first-level destinations as its primary information architecture: home, favorites, and profile.

#### Scenario: App enters a primary destination
- **WHEN** the user is on a first-level page
- **THEN** that page SHALL belong to exactly one of the three primary destinations: home, favorites, or profile

#### Scenario: User switches between primary destinations
- **WHEN** the user selects a different first-level destination
- **THEN** the miniapp SHALL navigate between home, favorites, and profile without routing through a page-local shortcut model

### Requirement: Page family ownership SHALL be explicit
Every miniapp page SHALL belong either to the primary-tab family or to the secondary-page family with back navigation.

#### Scenario: Primary-tab family page
- **WHEN** a page is part of the home, favorites, or profile flow
- **THEN** it SHALL use the primary navigation shell instead of behaving like an isolated secondary page

#### Scenario: Secondary-page family page
- **WHEN** a page belongs to login, register, audit-status, bid detail, or info detail
- **THEN** it SHALL use secondary-page navigation rules rather than primary-tab ownership

### Requirement: Home SHALL not duplicate first-level destinations through global header actions
Once favorites and profile are first-level destinations, home SHALL NOT expose them again as global header actions.

#### Scenario: Home top bar is rendered
- **WHEN** the user is on the home page
- **THEN** the home header SHALL NOT provide global favorite or profile entry actions that duplicate primary navigation

#### Scenario: Page-specific local action remains necessary
- **WHEN** a non-home page requires a local action such as favorite or share for the current content
- **THEN** that action MAY remain page-local without being treated as a first-level destination
