## ADDED Requirements

### Requirement: Process artifacts move out of the formal docs root
The repository SHALL move raw captures, prompt notes, and other process artifacts out of the formal `docs/` root.

#### Scenario: A file is raw research material
- **WHEN** a document mainly contains raw packet captures, prompt templates, or temporary investigation notes
- **THEN** that file is archived or relocated outside the formal docs root

### Requirement: Archived materials remain recoverable
The repository SHALL retain archival materials in a recoverable location when they still have traceability value.

#### Scenario: A historical file may still be useful
- **WHEN** a process document is no longer a formal doc but still supports debugging or historical review
- **THEN** it is moved to an archive-oriented location instead of being silently lost
