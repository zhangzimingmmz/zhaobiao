## ADDED Requirements

### Requirement: Register page SHALL use the auth-family long-form shell
The register page SHALL use the same auth-family visual language as the login page while preserving a longer, scrollable enterprise-registration form layout.

#### Scenario: Register page is rendered
- **WHEN** the user opens the register page
- **THEN** the page SHALL display a lighter auth-family brand header above the registration content
- **THEN** the main registration form SHALL appear inside a single dominant white card
- **THEN** the page SHALL allow the user to scroll through the longer form without breaking the auth-family shell

### Requirement: Register page SHALL keep resubmit context inside the main form experience
When the user is resubmitting after rejection, the register page SHALL present the resubmit context as part of the main registration card rather than as a disconnected standalone panel.

#### Scenario: Rejected application is reopened
- **WHEN** the register page is opened with rejected application context
- **THEN** the page SHALL prefill the known registration fields
- **THEN** the resubmit guidance SHALL appear as a light contextual section inside or directly attached to the main registration card
- **THEN** the resubmit guidance SHALL remain visually weaker than the form fields and primary submit action

### Requirement: Register controls SHALL match the auth-family form language
The register page SHALL use the same input, textarea, label, and primary CTA treatment as the auth-family login page, adapted for the longer enterprise form.

#### Scenario: Register form fields are shown
- **WHEN** the user views the registration form
- **THEN** text inputs and textarea SHALL use the auth-family editable field styling
- **THEN** the submit button SHALL use the auth-family primary CTA styling
- **THEN** required markers, labels, and supporting descriptions SHALL follow the same text hierarchy rules as the rest of the auth family
