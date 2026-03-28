## MODIFIED Requirements

### Requirement: Secondary pages SHALL use a back-navigation header family
Secondary pages SHALL use a single header family centered on back navigation and page-local context, and that family SHALL remain visually distinct from the redesigned tab-page headers. Secondary pages MUST NOT stack an additional page-title row, duplicate the same title in the body, or introduce a second back-navigation affordance that repeats the header-level return path.

#### Scenario: Form or status page
- **WHEN** the user is on login, register, or audit-status
- **THEN** the page SHALL render a secondary header with back navigation and a local page title

#### Scenario: Detail page with a page-local action
- **WHEN** the user is on a detail page that requires a local action such as favorite or share
- **THEN** the page SHALL use the secondary header family and keep that action scoped to the current page

#### Scenario: Channel list page
- **WHEN** the user is on a channel list page such as `工程建设`、`政府采购` or `信息公开`
- **THEN** the page SHALL treat the secondary header as the only title chain, and SHALL NOT render a duplicate title row or duplicate back affordance inside the body content
