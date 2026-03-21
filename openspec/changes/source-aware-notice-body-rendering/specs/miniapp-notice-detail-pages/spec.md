## MODIFIED Requirements

### Requirement: Structured detail sections SHALL use only supported fields
Notice detail pages SHALL only promote stable supported fields into structured sections and SHALL render the body content using the source-aware body result returned by the detail API instead of assuming the client can interpret raw source HTML or text on its own.

#### Scenario: Stable field exists
- **WHEN** a bid or info detail field is directly supported by the detail contract
- **THEN** the page SHALL render that field in the structured section defined for its detail type

#### Scenario: Field would require parsing body content
- **WHEN** a detail row would require parsing additional structure out of the raw body content
- **THEN** the page SHALL leave that information inside the server-rendered notice body instead of fabricating a structured row

#### Scenario: Detail page renders source-aware body result
- **WHEN** the detail API returns a formatted body result in `content`
- **THEN** the page SHALL treat that value as the canonical rendered notice body and SHALL not apply site-specific parsing rules in the client

## ADDED Requirements

### Requirement: Detail pages SHALL degrade cleanly when rendered body is unavailable
Notice detail pages and fallback information detail pages SHALL show a stable empty state when the API cannot provide rendered body content.

#### Scenario: Rendered body is empty
- **WHEN** the detail response returns no usable `content`
- **THEN** the page SHALL render the existing empty-body treatment instead of attempting to display broken markup or raw malformed text
