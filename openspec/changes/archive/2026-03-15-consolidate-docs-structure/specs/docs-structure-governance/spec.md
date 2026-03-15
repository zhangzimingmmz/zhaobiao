## ADDED Requirements

### Requirement: Docs root only contains formal documents
The repository SHALL keep only formal, long-term maintained documents in the `docs/` root directory.

#### Scenario: A reader opens the docs root
- **WHEN** a reader lists the files in `docs/`
- **THEN** the root directory contains only primary project, API, database, and workflow documents rather than mixed process artifacts

### Requirement: Formal documents have clear ownership roles
The documentation structure SHALL distinguish between primary documents, supplementary documents, and archived materials so each file has a clear role.

#### Scenario: A document overlaps another document
- **WHEN** two documents cover the same domain with different levels of authority
- **THEN** the structure marks one as the primary source and the other as merged, supplementary, or archived

### Requirement: Doc consolidation preserves discoverability
The documentation structure SHALL preserve a clear entry path for project overview, frontend APIs, backend APIs, database design, and development workflow.

#### Scenario: A new team member looks for core docs
- **WHEN** someone needs to find the main project documentation
- **THEN** they can locate the core docs without reading raw research materials or process notes
