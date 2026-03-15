## ADDED Requirements

### Requirement: Admin interfaces have a single documentation entry
The repository SHALL provide a single backend administration interface document that covers enterprise review, company directory, crawl control, and run record APIs.

#### Scenario: A frontend implementer reads admin API docs
- **WHEN** a frontend implementer looks for backend administration APIs
- **THEN** they can find the relevant admin endpoints from one unified document instead of multiple scattered files

### Requirement: Unified admin docs record unfinished interfaces
The unified admin interface documentation SHALL explicitly mark interfaces that are planned but not yet implemented.

#### Scenario: An admin capability lacks an API
- **WHEN** a required admin capability does not yet have a backend route
- **THEN** the admin interface document records the intended interface and marks it as unfinished

### Requirement: Admin docs separate requirements from API contracts
The repository SHALL keep admin requirement documents and admin API documents as separate artifacts.

#### Scenario: A reader compares backend scope and backend APIs
- **WHEN** a reader checks the admin requirements against the implemented or planned interfaces
- **THEN** the requirements remain in the admin demand document and the endpoint details remain in the admin API document
