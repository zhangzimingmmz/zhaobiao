## MODIFIED Requirements

### Requirement: Notice detail pages SHALL use the secondary-page content family
Bid detail pages SHALL continue to use the shared secondary-page content family as their normal detail destination. Information detail pages SHALL use the same secondary-page content family only when a record lacks a direct original-link path or otherwise needs a fallback in-app detail presentation. That family SHALL favor a calm white header, restrained first-card treatment, and content-first body hierarchy rather than a generic stacked-card dashboard look.

#### Scenario: Bid detail page is rendered
- **WHEN** the user opens a bid detail page
- **THEN** the page SHALL use the secondary-page content family instead of the retired hero-style shell or a generic unstructured page

#### Scenario: Information detail page is rendered as fallback
- **WHEN** the user opens an information detail page for a record without a direct original-link path or for a special non-standard record
- **THEN** the page SHALL use the same secondary-page content family while supporting the lighter information-detail structure appropriate to that content

#### Scenario: Detail-page visual hierarchy is reviewed
- **WHEN** the detail page is compared against the target PDF
- **THEN** the title card, time row, original-link action, and body sections SHALL read as one content flow with restrained container treatment rather than as several competing white blocks

### Requirement: Structured detail sections SHALL use only supported fields
Notice detail pages SHALL only promote stable supported fields into structured sections and SHALL keep the body content as raw notice content. The visual presentation of those structured sections SHALL remain secondary to the notice title and body.

#### Scenario: Stable field exists
- **WHEN** a bid or info detail field is directly supported by the detail contract
- **THEN** the page SHALL render that field in the structured section defined for its detail type

#### Scenario: Field would require parsing body content
- **WHEN** a detail row would require parsing additional structure out of the raw body content
- **THEN** the page SHALL leave that information inside the notice body instead of fabricating a structured row

#### Scenario: Structured section is visually reviewed
- **WHEN** the page renders structured rows and raw body content together
- **THEN** the structured section SHALL use calmer spacing and weaker container emphasis than the title area so the page still reads as a content page
