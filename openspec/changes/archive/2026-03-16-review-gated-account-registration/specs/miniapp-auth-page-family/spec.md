## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL continue using the shared secondary-page family, while updating the form structure to reflect the new registration-before-login review flow.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL render login-name and password fields, and SHALL remove the phone-captcha action from the primary login form

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL render the larger registration form for account and enterprise review fields within the same secondary-page family

### Requirement: Auth pages SHALL preserve their required entry actions
The auth page family SHALL preserve login, registration, review-status lookup, and resubmission entry actions inside the accepted layout.

#### Scenario: Login form is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL expose login-name and password inputs, login CTA, and entry affordances for registration or audit-status checking

#### Scenario: Register form is shown
- **WHEN** the register page is displayed
- **THEN** the page SHALL expose inputs for login name, login password, mobile, credit code, legal person name, legal person phone, business scope, and business address, plus the submission CTA

## ADDED Requirements

### Requirement: Auth pages SHALL align with review-gated account flow copy
The miniapp auth pages SHALL communicate that users must register first, wait for review, and only then use account-password login.

#### Scenario: Login page copy is shown
- **WHEN** the login page is displayed
- **THEN** the page SHALL explain that only approved accounts can log in

#### Scenario: Register success is shown
- **WHEN** the user submits registration successfully
- **THEN** the page SHALL guide the user to the audit-status page instead of implying immediate login availability
