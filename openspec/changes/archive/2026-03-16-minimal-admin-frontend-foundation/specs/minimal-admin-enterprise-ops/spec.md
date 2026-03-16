## ADDED Requirements

### Requirement: Minimal admin frontend provides an enterprise review list
The system SHALL provide an enterprise review list page that shows enterprise verification applications for operator review.

#### Scenario: Operator opens enterprise review
- **WHEN** the operator enters the enterprise review module
- **THEN** the backend frontend shows the list of enterprise review applications from the admin review list interface

### Requirement: Minimal admin frontend provides enterprise review detail actions
The system SHALL provide an enterprise review detail page where the operator can inspect submitted enterprise materials and trigger approve or reject actions.

#### Scenario: Operator reviews a specific application
- **WHEN** the operator opens a single review record
- **THEN** the page displays the enterprise information, license image, current status, and the approve or reject controls

### Requirement: Minimal admin frontend provides a company directory page
The system SHALL provide a company directory page that lists current enterprise records and their verification status.

#### Scenario: Operator opens the company directory
- **WHEN** the operator enters the company directory page
- **THEN** the page shows the company list from the company directory admin interface
