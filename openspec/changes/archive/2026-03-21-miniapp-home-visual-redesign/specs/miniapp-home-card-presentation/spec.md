## MODIFIED Requirements

### Requirement: Bid cards SHALL render only supported direct fields
Bid cards SHALL be composed from direct, supported list fields and SHALL collapse unsupported rows instead of fabricating values. The card presentation SHALL emphasize title, supported key metadata, and weak meta information through a clearer visual hierarchy rather than an older flat list-card appearance.

#### Scenario: Direct field is supported and present
- **WHEN** a bid-card field is directly present in the normalized list payload and allowed by the business-display rules
- **THEN** the card SHALL render that field within the redesigned hierarchy for title, supported tags, core business info, and weak meta information

#### Scenario: Field is missing or disallowed
- **WHEN** a row, badge, or value would require a missing field or a disallowed field
- **THEN** the card SHALL collapse that presentation instead of showing a synthetic placeholder or parsing `content`

### Requirement: Info cards SHALL use a lighter presentation model
Information-state cards SHALL use a presentation model that is simpler than bid cards and appropriate to information content, while still participating in the redesigned home visual language.

#### Scenario: Information record is rendered
- **WHEN** the home page renders an information-state list record
- **THEN** it SHALL use the accepted info-card hierarchy for title, time, and other directly supported fields with a lighter visual density than bid cards instead of reusing the denser bid-card presentation wholesale

