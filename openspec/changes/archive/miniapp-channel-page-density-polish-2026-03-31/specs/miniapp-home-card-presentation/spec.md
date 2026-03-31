## MODIFIED Requirements

### Requirement: Bid cards SHALL render only supported direct fields
Bid cards SHALL be composed from direct, supported list fields and SHALL collapse unsupported rows instead of fabricating values. In channel and favorites list contexts, the card presentation SHALL emphasize title, supported tags, core business info, and weak meta information through a compact list-card density rather than a thicker information-card rhythm.

#### Scenario: Direct field is supported and present
- **WHEN** a bid-card field is directly present in the normalized list payload and allowed by the business-display rules
- **THEN** the card SHALL render that field within the redesigned hierarchy for title, supported tags, core business info, and weak meta information

#### Scenario: Field is missing or disallowed
- **WHEN** a row, badge, or value would require a missing field or a disallowed field
- **THEN** the card SHALL collapse that presentation instead of showing a synthetic placeholder or parsing `content`

#### Scenario: Bid card is rendered in a channel or favorites list
- **WHEN** the miniapp renders a bid card inside a channel list or favorites list
- **THEN** the card SHALL use a denser list presentation with tighter vertical spacing and a weaker favorite affordance than a heavier standalone information card
