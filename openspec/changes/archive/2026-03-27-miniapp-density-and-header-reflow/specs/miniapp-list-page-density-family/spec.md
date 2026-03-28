## ADDED Requirements

### Requirement: Channel and favorites list pages SHALL use a single-spine first fold
Channel pages and the favorites page SHALL use a single-spine first-fold structure that exposes one header source, one local control region, and then the list itself. These pages SHALL NOT insert duplicate title layers, decorative transition blocks, or blank intermediary regions between header and content.

#### Scenario: Channel list page is rendered
- **WHEN** the user opens engineering, government, or information
- **THEN** the page SHALL present a single header title source, a compact local tools region, and the list without a duplicated body title layer

#### Scenario: Favorites list page is rendered
- **WHEN** the user opens the favorites tab
- **THEN** the page SHALL present the favorites title, a local type-selection section, and the list as one continuous page structure instead of as disconnected blocks

### Requirement: List pages SHALL reclaim excessive long-screen whitespace
List-family pages SHALL keep the first visible content regions within a bounded vertical rhythm on tall devices. They SHALL avoid large unused areas between the top of the page and the first list card or empty state.

#### Scenario: Tall viewport shows content
- **WHEN** a list-family page is displayed on a tall mobile viewport with available records
- **THEN** the first visible list card SHALL appear close enough to the local controls that the first fold reads as intentionally composed rather than partially empty

#### Scenario: Tall viewport shows an empty state
- **WHEN** a list-family page has no records for the current state
- **THEN** the empty state SHALL appear inside the same compact list rhythm rather than below a large unused gap
