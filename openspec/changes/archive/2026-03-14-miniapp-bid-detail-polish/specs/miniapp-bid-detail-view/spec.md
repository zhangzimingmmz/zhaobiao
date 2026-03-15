## ADDED Requirements

### Requirement: Bid detail page renders structured sections from stable fields
The bid detail page SHALL render its header and structured sections from stable top-level detail fields instead of parsing those values from `content`.

#### Scenario: Header card renders
- **WHEN** the bid detail API returns title, source, publish time, and notice type data
- **THEN** the page shows those values in the top header card

#### Scenario: Project information renders
- **WHEN** the bid detail API returns project info fields such as budget, purchaser, agency, or region
- **THEN** the page shows those values in the project information section

#### Scenario: Important times render
- **WHEN** the bid detail API returns deadline-related timestamps
- **THEN** the page shows those values in the important time section

### Requirement: Bid detail page preserves raw body content
The bid detail page SHALL render the raw detail body as rich text without deriving extra structured fields from it.

#### Scenario: Content exists
- **WHEN** the bid detail API returns `content`
- **THEN** the page renders the rich-text content section

#### Scenario: Content is absent
- **WHEN** the bid detail API does not return `content`
- **THEN** the page omits the content section and still renders the rest of the page

### Requirement: Bid detail page exposes an original-link action
The bid detail page SHALL provide an action for the original source link when an origin URL is available.

#### Scenario: Origin URL exists
- **WHEN** the detail payload contains an origin URL
- **THEN** the page shows the original-link action and performs the configured copy-first behavior
