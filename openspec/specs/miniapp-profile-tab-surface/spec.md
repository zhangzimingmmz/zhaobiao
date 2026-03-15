## ADDED Requirements

### Requirement: Profile SHALL support guest and authenticated states
The profile tab SHALL render different surface states for guests and authenticated users while preserving the same first-level destination identity.

#### Scenario: Guest enters profile
- **WHEN** the user is not logged in and enters the profile tab
- **THEN** the profile surface SHALL present a guest state with a clear login entry instead of rendering authenticated account blocks

#### Scenario: Authenticated user enters profile
- **WHEN** the user is logged in and enters the profile tab
- **THEN** the profile surface SHALL render account-related content rather than a generic guest placeholder

### Requirement: Profile SHALL express certification status clearly
The profile tab SHALL communicate pending, approved, and rejected certification states without reverting to the older hero-style shell.

#### Scenario: Certification is pending or rejected
- **WHEN** the authenticated user has not yet reached an approved certification state
- **THEN** the profile surface SHALL present that status and the appropriate next action inside the profile tab context

#### Scenario: Certification is approved
- **WHEN** the authenticated user is approved
- **THEN** the profile surface SHALL present approved account information and the available account-level actions

### Requirement: Profile SHALL not duplicate favorites as primary navigation
Profile SHALL stop using “my favorites” as a primary navigation block once favorites is a first-level destination.

#### Scenario: Profile surface is rendered
- **WHEN** the profile page is shown
- **THEN** any favorites-related entry, if present at all, SHALL be secondary to the first-level tab structure rather than acting as the primary way to reach favorites
