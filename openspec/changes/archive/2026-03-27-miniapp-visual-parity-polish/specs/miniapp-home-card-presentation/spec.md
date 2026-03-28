## MODIFIED Requirements

### Requirement: Bid cards SHALL render only supported direct fields
Bid cards SHALL be composed from direct, supported list fields and SHALL collapse unsupported rows instead of fabricating values. The card presentation SHALL emphasize title, supported key metadata, and weak meta information through a denser and calmer hierarchy rather than through large paddings, strong floating-card treatment, or over-decorated tag rows.

#### Scenario: Direct field is supported and present
- **WHEN** a bid-card field is directly present in the normalized list payload and allowed by the business-display rules
- **THEN** the card SHALL render that field within the redesigned hierarchy for title, supported tags, core business info, and weak meta information

#### Scenario: Field is missing or disallowed
- **WHEN** a row, badge, or value would require a missing field or a disallowed field
- **THEN** the card SHALL collapse that presentation instead of showing a synthetic placeholder or parsing `content`

#### Scenario: Card density is visually reviewed
- **WHEN** the channel list or favorites list is compared against the target PDF
- **THEN** bid cards SHALL present tighter title-to-meta spacing, lighter borders and shadows, and smaller local action weight than the current card implementation

### Requirement: Info cards SHALL use a lighter presentation model
Information-state cards SHALL use a presentation model that is simpler than bid cards and appropriate to information content, while still participating in the redesigned home visual language. That lighter model SHALL prefer calm surfaces and stable title/time rhythm over media-heavy or card-heavy treatment.

#### Scenario: Information record is rendered
- **WHEN** the home page renders an information-state list record
- **THEN** it SHALL use the accepted info-card hierarchy for title, time, and other directly supported fields with a lighter visual density than bid cards instead of reusing the denser bid-card presentation wholesale

#### Scenario: Information record without cover is rendered
- **WHEN** the information-state list renders a record without a usable cover image
- **THEN** the card SHALL preserve the same family rhythm without leaving a broken or overly heavy media placeholder
