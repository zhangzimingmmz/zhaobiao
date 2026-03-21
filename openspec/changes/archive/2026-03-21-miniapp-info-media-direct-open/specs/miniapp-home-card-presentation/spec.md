## MODIFIED Requirements

### Requirement: Info cards SHALL use a lighter presentation model
Information-state cards SHALL use a presentation model that is simpler than bid cards and appropriate to information content. That model SHALL explicitly support mixed media states, with stable title/summary/time rhythm across cards, and SHALL treat missing or failed cover images as a first-class no-image state instead of leaving a broken media window.

#### Scenario: Information record with valid cover is rendered
- **WHEN** the home page renders an information-state list record with a valid cover image
- **THEN** it SHALL use the accepted info-card hierarchy with real cover media, title, time, and other directly supported fields instead of reusing the denser bid-card presentation wholesale

#### Scenario: Information record without cover is rendered
- **WHEN** the home page renders an information-state list record whose cover field is empty
- **THEN** it SHALL render the same info-card family in a no-image state with a stable layout rhythm

#### Scenario: Information record cover fails to load
- **WHEN** the home page renders an information-state list record whose cover URL cannot be loaded
- **THEN** the card SHALL degrade to the no-image state instead of leaving a gray image window or a broken image frame

#### Scenario: Mixed media records share one list
- **WHEN** the information-state list contains both image and no-image records
- **THEN** the cards SHALL preserve a stable visual rhythm through consistent line clamping and minimum-height strategy
