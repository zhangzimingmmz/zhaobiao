## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL continue to use a shared secondary-page family centered on back navigation and compact mobile framing, while allowing the login page to adopt a more explicit form-dominant hierarchy with lighter chrome and clearer field styling.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family
- **THEN** the login page SHALL present a form-first hierarchy where the form area is visually dominant over the brand and preview bands
- **THEN** the login page SHALL use lighter card chrome, clearer field labels, and stronger primary-CTA emphasis than the current flat gray treatment

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same secondary-page family while accommodating the larger enterprise-registration form
- **THEN** the register page SHALL remain compatible with shared auth-page visual tokens where those tokens do not reduce form clarity

### Requirement: Auth pages SHALL preserve their required entry actions
The auth page family SHALL preserve login, registration, and agreement actions inside the accepted layout while letting login-page secondary content recede behind the primary form action.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose the required login fields, submission CTA, registration entry, agreement messaging, and guest preview inside the accepted form layout
- **THEN** the login submission CTA SHALL remain the strongest action in the layout
- **THEN** registration text, agreement copy, and preview cards SHALL be visually weaker than the login CTA

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose the required enterprise-registration fields, upload action, and submission CTA inside the accepted form layout
