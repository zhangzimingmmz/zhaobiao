## ADDED Requirements

### Requirement: Home entry page SHALL use a restrained channel-entry composition
The home entry page SHALL present the product as a business entry surface rather than a marketing hero page. The page SHALL use a restrained top section with the product title and a compact supporting line, and the first screen SHALL prioritize the three channel-entry cards over decorative gradients or oversized promotional copy.

#### Scenario: Home entry page is rendered
- **WHEN** the user enters the home tab after login
- **THEN** the page SHALL present a restrained brand header and a compact channel-entry composition instead of a dominant promotional hero block

#### Scenario: First-screen hierarchy is evaluated
- **WHEN** the user views the first screen of the home tab
- **THEN** the three channel-entry cards SHALL be the primary interaction focus and SHALL NOT compete with a large decorative hero section

### Requirement: Channel-entry cards SHALL form a calm, unified family
The three home entry cards SHALL share one visual family with consistent padding, corner radius, icon treatment, title rhythm, and subdued accent usage. They SHALL read as channel destinations rather than as content cards or marketing tiles.

#### Scenario: Entry cards are rendered together
- **WHEN** the home page renders the engineering, government, and information entries
- **THEN** the cards SHALL share one calm visual family with matched density and restrained accent treatment

#### Scenario: Entry card contains icon, title, and subtitle
- **WHEN** an entry card renders its left icon block, channel title, and supporting line
- **THEN** those elements SHALL support the channel hierarchy without oversized decorative glyphs, strong color competition, or exaggerated left-side emphasis
