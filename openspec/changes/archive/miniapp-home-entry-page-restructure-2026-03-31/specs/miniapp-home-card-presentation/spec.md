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
Information-state cards SHALL use a presentation model that is simpler than bid cards and appropriate to information content, while still participating in the redesigned home visual language. That model SHALL explicitly support mixed media states, with stable title/summary/time rhythm across cards, and SHALL treat missing or failed cover images as a first-class no-image state instead of leaving a broken media window.

#### Scenario: Information record is rendered
- **WHEN** the home page renders an information-state list record
- **THEN** it SHALL use the accepted info-card hierarchy for title, time, and other directly supported fields with a lighter visual density than bid cards instead of reusing the denser bid-card presentation wholesale

#### Scenario: Information record without cover is rendered
- **WHEN** the home page renders an information-state list record whose cover field is empty
- **THEN** it SHALL render the same info-card family in a no-image state with a stable layout rhythm

#### Scenario: Information record cover fails to load
- **WHEN** the home page renders an information-state list record whose cover URL cannot be loaded
- **THEN** the card SHALL degrade to the no-image state instead of leaving a gray image window or a broken image frame

#### Scenario: Mixed media records share one list
- **WHEN** the information-state list contains both image and no-image records
- **THEN** the cards SHALL preserve a stable visual rhythm through consistent line clamping and minimum-height strategy

### Requirement: Home channel entry cards SHALL render as primary navigation buttons
The home page SHALL present its three channel entry cards as primary navigation buttons instead of information-rich explainer cards. Each entry card SHALL keep only the channel icon block, the channel title, and a clear right-arrow affordance, and SHALL NOT render per-channel subtitle copy or recommendation badge copy inside the card body.

#### Scenario: Home renders the engineering entry
- **WHEN** the home page renders the engineering channel entry
- **THEN** that card SHALL show the engineering icon block, the `工程建设` title, and a right-arrow affordance without additional subtitle text or recommendation text

#### Scenario: Home renders the three channel entries
- **WHEN** the home page renders its full set of first-level channel entries
- **THEN** each card SHALL use the same primary-entry card family and SHALL read as a tappable channel button rather than as an informational summary card
