## ADDED Requirements

### Requirement: Home SHALL render a dedicated brand hero for channel entry
The miniapp home page SHALL render a dedicated brand hero as the top visual block of the page. That hero SHALL present the `金堂招讯通` brand title, one short brand subtitle, and a lightweight decorative visual on a deep blue surface so that the page reads as a channel-entry page rather than a mixed platform dashboard.

#### Scenario: Home page is rendered after authentication
- **WHEN** the authenticated user opens the home first-level destination
- **THEN** the page SHALL present a dedicated deep-blue brand hero above the channel entry cards, with the brand title and one short subtitle as the only textual content inside that hero

#### Scenario: Brand hero visual is composed
- **WHEN** the home brand hero is rendered
- **THEN** the hero SHALL include a lightweight decorative visual treatment that reinforces the brand block without introducing a separate data module, search box, or explanatory card inside the hero
