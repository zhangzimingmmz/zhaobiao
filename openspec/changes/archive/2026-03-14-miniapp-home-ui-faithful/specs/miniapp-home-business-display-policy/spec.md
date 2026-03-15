## ADDED Requirements

### Requirement: Business-display rules SHALL override demo-only richness
The miniapp home page SHALL not display structured information that is not directly supported by the applicable business rules and data contract, even if the `ui` demo shows a richer presentation.

#### Scenario: Field exists only in derived content
- **WHEN** a card field would require parsing `content` or inferring structure from non-direct data
- **THEN** the miniapp SHALL keep that information inside the raw content flow and SHALL NOT promote it into the card structure

#### Scenario: Field is absent from the direct list contract
- **WHEN** the `ui` reference includes a row or badge whose backing field is absent from the direct list payload
- **THEN** the miniapp SHALL collapse that row or badge rather than fabricate a placeholder value

### Requirement: Direct fields SHALL still use the `ui` presentation model
For fields that are directly supported by the business rules and list payload, the miniapp SHALL follow the `ui` presentation model as closely as possible.

#### Scenario: Supported field is available
- **WHEN** a direct field such as title, publish time, source, purchaser, budget, or region is present and allowed
- **THEN** the miniapp SHALL render it using the corresponding `ui` hierarchy and styling intent

#### Scenario: Supported field is intentionally hidden by business rule
- **WHEN** a field is present technically but disallowed by the agreed business-display rule
- **THEN** the business-display rule SHALL take precedence over the `ui` demo presentation
