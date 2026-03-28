## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL use a shared secondary-page family centered on back navigation, compact page framing, and form-first content layout. For the login page, the body SHALL be organized as a three-band layout containing a lightweight brand band, a dominant form band, and a secondary preview band.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family instead of the retired blue hero shell
- **THEN** the login page body SHALL arrange its primary content into brand, form, and preview bands rather than relying on unbounded natural-flow spacing
- **THEN** the form band SHALL remain visually larger and more prominent than the brand band and the preview band

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same secondary-page family while accommodating the larger enterprise-registration form

### Requirement: Auth pages SHALL preserve their required entry actions
The auth page family SHALL preserve login, registration, and agreement actions inside the accepted layout. For the login page, those actions SHALL remain in the dominant form band even when a guest preview module is present below it.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose the required login fields, low-weight registration entry, and agreement messaging inside the form band
- **THEN** the preview band SHALL remain secondary to the form band and SHALL NOT visually overtake the primary login action

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose the required enterprise-registration fields, upload action, and submission CTA inside the accepted form layout
