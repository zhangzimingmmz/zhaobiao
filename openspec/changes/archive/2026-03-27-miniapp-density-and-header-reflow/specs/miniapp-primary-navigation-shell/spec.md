## MODIFIED Requirements

### Requirement: The miniapp SHALL expose three first-level destinations
The miniapp SHALL use three first-level destinations as its primary information architecture: home, favorites, and profile. The redesigned shell SHALL strengthen the recognition of those three destinations through a clearer first-level navigation language rather than treating the shell as a neutral container only, and each first-level page SHALL provide a stable first-fold composition that does not leave large inert blank regions on common mobile viewports.

#### Scenario: App enters a primary destination
- **WHEN** the user is on a first-level page
- **THEN** that page SHALL belong to exactly one of the three primary destinations and SHALL use the redesigned shell language that makes those destinations visually legible

#### Scenario: User switches between primary destinations
- **WHEN** the user selects a different first-level destination
- **THEN** the miniapp SHALL navigate between home, favorites, and profile without routing through a page-local shortcut model and SHALL preserve the redesigned first-level navigation styling

### Requirement: Page family ownership SHALL be explicit
Every miniapp page SHALL belong either to the primary-tab family or to the secondary-page family with back navigation, and the redesigned shell SHALL keep those families visually distinct. Within the primary-tab family, home and favorites SHALL each expose their own local page sections rather than relying on a generic shell plus disconnected components.

#### Scenario: Primary-tab family page
- **WHEN** a page is part of the home, favorites, or profile flow
- **THEN** it SHALL use the redesigned primary navigation shell and a page-specific first section instead of behaving like an isolated secondary page or a minimally styled container

#### Scenario: Secondary-page family page
- **WHEN** a page belongs to login, register, audit-status, bid detail, or info detail
- **THEN** it SHALL use secondary-page navigation rules rather than primary-tab ownership
