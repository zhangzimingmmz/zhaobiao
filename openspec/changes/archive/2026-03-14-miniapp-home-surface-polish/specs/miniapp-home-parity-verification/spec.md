## MODIFIED Requirements

### Requirement: Home parity SHALL be reviewed by explicit comparison states
The miniapp home page SHALL be accepted only after state-by-state comparison against the `ui` reference for the home content surface inside the accepted miniapp shell, rather than by a single aggregate impression or by shell-free screenshots.

#### Scenario: Primary and secondary state comparison
- **WHEN** parity review is performed for the home page
- **THEN** the review SHALL compare at least the engineering-engineering, engineering-procurement, procurement-intention, procurement-announcement, and information content states against the accepted shell-aware reference

#### Scenario: Overlay comparison
- **WHEN** parity review is performed for filter overlays
- **THEN** the review SHALL compare each supported overlay type against the accepted home hierarchy for that state and note any approved shell-aware exceptions
