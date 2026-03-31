## ADDED Requirements

### Requirement: Channel lists SHALL prioritize rapid visual scanning
Channel list pages SHALL organize each notice row for rapid visual scanning, so that users can quickly distinguish the title, list type, and weak supporting information without reading the full card line by line.

#### Scenario: User scans a channel list
- **WHEN** a user views a channel list page with multiple notices
- **THEN** each row SHALL present a clear hierarchy of title first, type second, and weaker supporting information last instead of giving all visible fields near-equal weight

#### Scenario: Long notice title is rendered
- **WHEN** a notice title is long enough to wrap
- **THEN** the row SHALL preserve fast scanning by clamping the title and keeping the supporting information visually subordinate

### Requirement: Channel tool areas SHALL present one dominant search-first hierarchy
The channel tool area SHALL visually prioritize the search input as the primary tool, while keeping tabs and filter buttons available as secondary controls in the same grouped area.

#### Scenario: Tool area is visible
- **WHEN** a channel page renders its tool area
- **THEN** the search input SHALL read as the primary control, and the tab row and filter buttons SHALL appear as supporting controls rather than equal competing blocks

#### Scenario: Tool area is viewed on mobile width
- **WHEN** the user views the tool area on a phone-sized viewport
- **THEN** the grouped controls SHALL preserve a clear scan order of tabs, search, and filters without appearing as unrelated components
