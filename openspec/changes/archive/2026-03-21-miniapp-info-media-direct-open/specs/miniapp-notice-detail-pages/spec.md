## MODIFIED Requirements

### Requirement: Notice detail pages SHALL use the secondary-page content family
Bid detail pages SHALL continue to use the shared secondary-page content family as their normal detail destination. Information detail pages SHALL use the same secondary-page content family only when a record lacks a direct original-link path or otherwise needs a fallback in-app detail presentation.

#### Scenario: Bid detail page is rendered
- **WHEN** the user opens a bid detail page
- **THEN** the page SHALL use the secondary-page content family instead of the retired hero-style shell or a generic unstructured page

#### Scenario: Information detail page is rendered as fallback
- **WHEN** the user opens an information detail page for a record without a direct original-link path or for a special non-standard record
- **THEN** the page SHALL use the same secondary-page content family while supporting the lighter information-detail structure appropriate to that content
