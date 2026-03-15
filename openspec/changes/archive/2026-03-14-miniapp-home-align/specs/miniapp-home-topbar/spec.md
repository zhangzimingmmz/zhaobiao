## ADDED Requirements

### Requirement: Home page uses a custom white top bar
The miniapp home page SHALL render a custom white top bar instead of the default blue system navigation bar.

#### Scenario: Home top bar is visible
- **WHEN** the user opens the home page
- **THEN** the page shows a white top bar with a single-line title and no duplicated blue system title bar above it

### Requirement: Home top bar exposes favorites and profile actions
The home top bar SHALL expose a favorites action and a profile action on the right side.

#### Scenario: User opens favorites from the home top bar
- **WHEN** the user taps the favorites action in the home top bar
- **THEN** the miniapp navigates to the favorites page route

#### Scenario: User opens profile from the home top bar
- **WHEN** the user taps the profile action in the home top bar
- **THEN** the miniapp switches to the profile tab
