## ADDED Requirements

### Requirement: Home parity SHALL be reviewed by explicit comparison states
The miniapp home page SHALL be accepted only after state-by-state comparison against the `ui` reference instead of by a single aggregate impression.

#### Scenario: Primary and secondary state comparison
- **WHEN** parity review is performed for the home page
- **THEN** the review SHALL compare at least the engineering-engineering, engineering-procurement, procurement-intention, procurement-announcement, and information states against the `ui` reference

#### Scenario: Overlay comparison
- **WHEN** parity review is performed for filter overlays
- **THEN** the review SHALL compare each supported overlay type against the `ui` reference hierarchy and note any approved exceptions

### Requirement: Every approved deviation SHALL be attributable
Any deviation from the `ui` reference that remains in the accepted miniapp implementation SHALL be traceable to either a platform exception or a business-display rule.

#### Scenario: Platform exception is used
- **WHEN** a miniapp implementation differs from the `ui` reference because of runtime behavior
- **THEN** the deviation SHALL be identified as a platform exception rather than left unexplained

#### Scenario: Business rule is used
- **WHEN** a miniapp implementation differs from the `ui` reference because a field cannot be displayed under the agreed business rules
- **THEN** the deviation SHALL be identified as a business-display exception rather than left unexplained
