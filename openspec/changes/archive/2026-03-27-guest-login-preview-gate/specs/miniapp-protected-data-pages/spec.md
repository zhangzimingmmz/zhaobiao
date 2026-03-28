## ADDED Requirements

### Requirement: Data pages SHALL require authentication
The miniapp SHALL require authentication before allowing access to full data pages, including the home data entry page, channel pages, favorites, and detail pages.

#### Scenario: Guest reaches a protected page
- **WHEN** an unauthenticated user attempts to enter a protected data page
- **THEN** the miniapp SHALL redirect or route that user to the login page instead of showing the full data page

#### Scenario: Authenticated user reaches a protected page
- **WHEN** an authenticated user enters a protected data page
- **THEN** the miniapp SHALL allow normal access to that page

### Requirement: Launch flow SHALL branch by authentication state
The launch page SHALL branch into the authenticated or guest path after its opening sequence instead of always entering the home page.

#### Scenario: Launch completes for guest
- **WHEN** the launch sequence completes and no valid token exists
- **THEN** the miniapp SHALL route the user to the login page

#### Scenario: Launch completes for authenticated user
- **WHEN** the launch sequence completes and a valid token exists
- **THEN** the miniapp SHALL route the user to the home page
