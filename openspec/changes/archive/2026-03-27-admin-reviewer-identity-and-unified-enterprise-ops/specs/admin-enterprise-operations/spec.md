## MODIFIED Requirements

### Requirement: Admin frontend provides an enterprise review queue
The admin frontend SHALL provide a unified enterprise-operations module rather than two independent but highly duplicated pages. Within that module, operators MUST be able to enter an application-oriented review view that supports status-based inspection of enterprise verification requests such as pending, processed, and all applications.

#### Scenario: Operator opens the enterprise review view
- **WHEN** an operator opens the enterprise-operations module and selects the application view
- **THEN** the system shows a list view for enterprise verification requests
- **AND** that list supports status-based inspection of pending, approved, and rejected applications

### Requirement: Admin frontend provides enterprise review detail actions
The admin frontend SHALL provide an application-detail view where operators can inspect submitted materials and complete approve or reject decisions. The actions exposed in that view MUST respect administrator role boundaries: reviewers may approve or reject, while super administrators MAY additionally access higher-risk follow-up actions such as application invalidation when such actions are provided.

#### Scenario: Reviewer handles a review request
- **WHEN** a reviewer opens an enterprise application detail record
- **THEN** the page presents the submitted enterprise information, current status, and the approve/reject actions required for review
- **AND** the page shows the latest audit identity when available

#### Scenario: Super administrator handles exceptional cleanup
- **WHEN** a super administrator opens an enterprise application detail record for a test or exceptional case
- **THEN** the page MAY expose additional high-risk follow-up actions that are not available to reviewers

### Requirement: Admin frontend provides a company directory
The admin frontend SHALL provide a company-profile view inside the same enterprise-operations module so operators can inspect the current state of known companies without leaving the module. The company-profile view MAY reuse list infrastructure from the application view, but it MUST remain distinguishable as a current-profile view rather than an application queue.

#### Scenario: Operator inspects current enterprise status
- **WHEN** an operator switches from the application view to the company-profile view
- **THEN** the system shows the current enterprise records with their latest certification state
- **AND** the operator remains within the same enterprise-operations module

### Requirement: Admin frontend reserves a company detail view
The admin frontend SHALL provide a company-detail view that presents enterprise identity, latest review outcome, and related operational notes. The company-detail view MUST show audit identity when available, and it MUST separate read-only reviewer capabilities from super-administrator maintenance actions such as editing company profile data or deleting test data.

#### Scenario: Reviewer opens company detail
- **WHEN** a reviewer opens a company record
- **THEN** the page shows the enterprise profile and latest review outcome in read-only form
- **AND** it does not expose super-administrator-only maintenance actions

#### Scenario: Super administrator opens company detail
- **WHEN** a super administrator opens a company record
- **THEN** the page shows the enterprise profile and latest review outcome
- **AND** it MAY expose controlled maintenance actions such as editing company profile data or deleting test data
