## ADDED Requirements

### Requirement: AvatarInitials SHALL display first character of legal person name
The AvatarInitials component SHALL render a circular avatar with the first character of the legal person name (法人姓名) as the display text.

#### Scenario: Legal person name is provided
- **WHEN** the component receives a non-empty `name` prop (法人姓名)
- **THEN** the avatar SHALL display the first character of that name in a circular container

#### Scenario: Legal person name is empty
- **WHEN** the component receives an empty or missing `name` prop
- **THEN** the avatar SHALL display the first character of `username` or a fallback character (e.g. "?" or last digit of mobile)

### Requirement: AvatarInitials SHALL use consistent background color per account
The avatar background color SHALL be deterministic based on `userId` or `username`, so the same account always shows the same color.

#### Scenario: Same account renders avatar multiple times
- **WHEN** the same `userId` or `username` is passed to AvatarInitials
- **THEN** the background color SHALL be identical across renders

#### Scenario: Different accounts render avatars
- **WHEN** different `userId` or `username` values are passed
- **THEN** the background colors SHALL differ (or at least be deterministically mapped from a small palette)
