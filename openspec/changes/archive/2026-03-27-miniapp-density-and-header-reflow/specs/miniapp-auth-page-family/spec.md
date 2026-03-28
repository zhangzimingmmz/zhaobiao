## MODIFIED Requirements

### Requirement: Login and register SHALL use the secondary-page form family
Login and register SHALL use a shared secondary-page family centered on back navigation, compact page framing, and form-first content layout. The login page SHALL keep its core title, form card, and preview start within a tighter first-fold rhythm than the current implementation, and the preview region SHALL remain visually subordinate to the form.

#### Scenario: Login page is rendered
- **WHEN** the user opens the login page
- **THEN** the page SHALL use the secondary-page header family and a compact form-first layout instead of the retired blue hero shell

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL use the same secondary-page family while accommodating the larger enterprise-registration form
