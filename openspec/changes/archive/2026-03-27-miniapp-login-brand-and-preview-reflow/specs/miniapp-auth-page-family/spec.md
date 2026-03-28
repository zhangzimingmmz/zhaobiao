## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL use a shared secondary-page family centered on back navigation, compact page framing, and form-first content layout. The login page SHALL use the header title as its only explicit page-title source, SHALL replace the old explanation-heavy intro block with a lighter brand-first surface, and SHALL keep the preview region visually subordinate to the form.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family and a compact form-first layout instead of the retired blue hero shell
- **THEN** the body SHALL NOT render a duplicate eyebrow-style `登录` label beneath the header
- **THEN** the login page SHALL expose a lightweight brand region ahead of the form rather than a long explanatory intro block

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same secondary-page family while accommodating the larger enterprise-registration form

### Requirement: Auth pages SHALL preserve their required entry actions
The auth page family SHALL preserve login, registration, verification-code, and agreement actions inside the new layout. For the login page, these actions SHALL remain available inside the form card even after the brand-first reflow.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose the required login fields, registration entry, and agreement messaging inside the accepted form layout
- **THEN** the preview region, if present, SHALL remain a secondary section below the primary form interaction
- **THEN** the login page SHOULD use a vertical flex layout so the preview region can absorb remaining viewport height instead of leaving a large empty tail below the content

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose the required enterprise-registration fields, upload action, and submission CTA inside the accepted form layout
