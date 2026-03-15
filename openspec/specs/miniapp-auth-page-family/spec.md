## ADDED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL use a shared secondary-page family centered on back navigation, compact page framing, and form-first content layout.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family and a compact form-first layout instead of the retired blue hero shell

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same secondary-page family while accommodating the larger enterprise-registration form

### Requirement: Auth pages SHALL preserve their required entry actions
The auth page family SHALL preserve login, registration, verification-code, and agreement actions inside the new layout.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose the required login fields, verification-code action, and agreement messaging inside the accepted form layout

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose the required enterprise-registration fields, upload action, and submission CTA inside the accepted form layout
