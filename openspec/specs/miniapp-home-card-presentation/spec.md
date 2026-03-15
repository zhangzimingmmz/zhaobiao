## ADDED Requirements

### Requirement: Bid cards SHALL render only supported direct fields
Bid cards SHALL be composed from direct, supported list fields and SHALL collapse unsupported rows instead of fabricating values.

#### Scenario: Direct field is supported and present
- **WHEN** a bid-card field is directly present in the normalized list payload and allowed by the business-display rules
- **THEN** the card SHALL render that field using the accepted home-card hierarchy

#### Scenario: Field is missing or disallowed
- **WHEN** a row, badge, or value would require a missing field or a disallowed field
- **THEN** the card SHALL collapse that presentation instead of showing a synthetic placeholder or parsing `content`

### Requirement: Info cards SHALL use a lighter presentation model
Information-state cards SHALL use a presentation model that is simpler than bid cards and appropriate to information content.

#### Scenario: Information record is rendered
- **WHEN** the home page renders an information-state list record
- **THEN** it SHALL use the accepted info-card hierarchy for title, time, and other directly supported fields instead of reusing the denser bid-card presentation wholesale
