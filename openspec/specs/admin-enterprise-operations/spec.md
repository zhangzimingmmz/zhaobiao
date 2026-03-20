## ADDED Requirements

### Requirement: Admin frontend provides an enterprise review queue
The admin frontend SHALL provide a dedicated enterprise review list for pending, approved, and rejected enterprise verification requests.

#### Scenario: Operator reviews the queue
- **WHEN** an operator opens the enterprise review module
- **THEN** the system shows a list view that supports status-based inspection of enterprise verification requests

### Requirement: Admin frontend provides enterprise review detail actions
The admin frontend SHALL provide an enterprise review detail page where operators can inspect submitted materials and complete approve or reject decisions.

#### Scenario: Operator handles a review request
- **WHEN** an operator opens an enterprise review detail record
- **THEN** the page presents the submitted enterprise information, supporting material, current status, and the required decision actions

### Requirement: Admin frontend provides a company directory
The admin frontend SHALL provide a company directory separate from the review queue so operators can inspect the current state of known companies independent of pending review tasks.

#### Scenario: Operator inspects current enterprise status
- **WHEN** an operator opens the company directory
- **THEN** the system shows a searchable or filterable list of companies with their current enterprise verification state

### Requirement: Admin frontend reserves a company detail view
The admin frontend SHALL reserve a company detail view that can present enterprise identity, latest review outcome, and related operational notes even if some fields are initially read-only or incomplete.

#### Scenario: Company detail lacks complete backend fields
- **WHEN** an operator opens a company record before all supporting APIs are available
- **THEN** the page still renders a structured company detail layout with clear placeholders for missing sections
