## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL use a shared secondary-page family centered on back navigation, compact page framing, and form-first content layout. The login page MAY add a secondary guest preview section beneath the form, but the form SHALL remain the dominant entry action.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family and a compact form-first layout instead of the retired blue hero shell

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same secondary-page family while accommodating the larger enterprise-registration form

### Requirement: Auth pages SHALL preserve their required entry actions
The auth page family SHALL preserve login, registration, verification-code, and agreement actions inside the new layout, and any guest preview content SHALL remain secondary to those actions.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose the required login fields, verification-code action, and agreement messaging inside the accepted form layout

#### Scenario: Login page also shows preview content
- **WHEN** the login page includes a guest preview carousel
- **THEN** that preview SHALL appear beneath the primary login actions and SHALL NOT displace the login form as the dominant page purpose

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose the required enterprise-registration fields, upload action, and submission CTA inside the accepted form layout
