## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL use a shared secondary-page family centered on back navigation, compact page framing, and form-first content layout. The login page MAY include a secondary preview module, but that module SHALL remain visually subordinate to the intro copy and the primary form card.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family and a compact form-first layout instead of the retired blue hero shell

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same secondary-page family while accommodating the larger enterprise-registration form

#### Scenario: Login page includes preview content
- **WHEN** the login page renders the guest preview module beneath the form
- **THEN** the preview section SHALL use lighter borders, tighter spacing, and lower visual weight than the form card so the page still reads as a login page first

### Requirement: Auth pages SHALL preserve their required entry actions
The auth page family SHALL preserve login, registration, verification-code, and agreement actions inside the new layout, and the visual hierarchy SHALL keep those actions clearer than supporting copy or preview content.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose the required login fields, verification-code action, and agreement messaging inside the accepted form layout

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose the required enterprise-registration fields, upload action, and submission CTA inside the accepted form layout

#### Scenario: Auth-page visual weight is reviewed
- **WHEN** the login page is compared against the target PDF
- **THEN** the form card, submit button, register entry, and agreement block SHALL remain the dominant interaction cluster rather than being visually flattened into a generic card stack
