## MODIFIED Requirements

### Requirement: Bid cards SHALL render only supported direct fields
Bid cards SHALL be composed from direct, supported list fields and SHALL collapse unsupported rows instead of fabricating values. The card presentation SHALL emphasize title, supported key metadata, and weak meta information through a clearer visual hierarchy rather than an older flat list-card appearance. In channel and favorites list contexts, bid cards SHALL further support scan-first reading by keeping supporting information visibly lighter and more compact than the title layer.

#### Scenario: Direct field is supported and present
- **WHEN** a bid-card field is directly present in the normalized list payload and allowed by the business-display rules
- **THEN** the card SHALL render that field within the redesigned hierarchy for title, supported tags, core business info, and weak meta information

#### Scenario: Field is missing or disallowed
- **WHEN** a row, badge, or value would require a missing field or a disallowed field
- **THEN** the card SHALL collapse that presentation instead of showing a synthetic placeholder or parsing `content`

#### Scenario: Bid card is rendered in a scan-first list context
- **WHEN** a bid card is rendered in a channel list or favorites list
- **THEN** the card SHALL preserve a strong title layer, a lighter type/tag layer, and a weaker supporting-information layer so that repeated metadata does not compete with the main notice title
