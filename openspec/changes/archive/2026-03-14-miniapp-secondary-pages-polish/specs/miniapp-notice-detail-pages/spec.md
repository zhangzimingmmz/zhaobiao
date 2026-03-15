## ADDED Requirements

### Requirement: Notice detail pages SHALL use the secondary-page content family
Bid detail and information detail pages SHALL use a shared secondary-page content family with back navigation, local page actions, and scrollable notice content.

#### Scenario: Bid detail page is rendered
- **WHEN** the user opens a bid detail page
- **THEN** the page SHALL use the secondary-page content family instead of the retired hero-style shell or a generic unstructured page

#### Scenario: Information detail page is rendered
- **WHEN** the user opens an information detail page
- **THEN** the page SHALL use the same secondary-page content family while supporting the lighter information-detail structure appropriate to that content

### Requirement: Structured detail sections SHALL use only supported fields
Notice detail pages SHALL only promote stable supported fields into structured sections and SHALL keep the body content as raw notice content.

#### Scenario: Stable field exists
- **WHEN** a bid or info detail field is directly supported by the detail contract
- **THEN** the page SHALL render that field in the structured section defined for its detail type

#### Scenario: Field would require parsing body content
- **WHEN** a detail row would require parsing additional structure out of the raw body content
- **THEN** the page SHALL leave that information inside the notice body instead of fabricating a structured row

### Requirement: Detail-page actions SHALL stay page-local
Favorite, share, and original-link behaviors SHALL remain local to detail pages and SHALL integrate with the shared favorites model where applicable.

#### Scenario: Bid detail favorite is toggled
- **WHEN** the user toggles favorite on a bid detail page
- **THEN** the page SHALL update the shared favorites model using the normalized notice record shape

#### Scenario: Information detail exposes external action
- **WHEN** an information detail page offers share or original-link behavior
- **THEN** that action SHALL remain scoped to the current notice page rather than to the app shell
