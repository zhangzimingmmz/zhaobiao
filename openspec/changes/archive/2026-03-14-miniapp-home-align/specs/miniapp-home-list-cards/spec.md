## ADDED Requirements

### Requirement: Bid cards render richer list metadata
Bid cards on the home page SHALL render richer metadata rows when the list item provides the corresponding fields.

#### Scenario: Bid card shows amount and labels
- **WHEN** the list item contains purchase nature, purchase manner, or budget fields
- **THEN** the bid card shows the available labels and formatted amount in the card meta area

#### Scenario: Bid card shows purchaser and region
- **WHEN** the list item contains purchaser and region fields
- **THEN** the bid card shows purchaser and region rows with compact metadata styling

#### Scenario: Bid card shows deadline
- **WHEN** the list item contains `expireTime` or `openTenderTime`
- **THEN** the bid card shows a deadline row using the available time field

### Requirement: Info cards support optional cover images
Info cards on the home page SHALL support an optional right-side cover image.

#### Scenario: Cover image is present
- **WHEN** the info list item contains a `cover` field
- **THEN** the info card shows the cover image without hiding the title, summary, or publish time

#### Scenario: Cover image is absent
- **WHEN** the info list item does not contain a `cover` field
- **THEN** the info card renders a text-only layout
