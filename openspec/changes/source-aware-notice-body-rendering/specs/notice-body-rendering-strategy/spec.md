## ADDED Requirements

### Requirement: Notice body rendering SHALL be source-aware
The system SHALL choose the notice-body rendering strategy based on the source site instead of applying one global formatter to every notice body.

#### Scenario: site2 notice body is rendered
- **WHEN** a detail response is built for a notice whose `site` is `site2_ccgp_sichuan`
- **THEN** the system SHALL treat the stored body as HTML content and apply a lightweight cleanup plus unified miniapp-friendly styling strategy

#### Scenario: site1 notice body is rendered
- **WHEN** a detail response is built for a notice whose `site` is `site1_sc_ggzyjy`
- **THEN** the system SHALL treat the stored body as a text-first source and rebuild readable paragraph blocks using numbering and field-boundary heuristics

### Requirement: Rendering SHALL preserve raw storage and produce a derived body
The system MUST keep the raw stored notice content unchanged and derive the rendered body only in the read path used by detail responses.

#### Scenario: historical notice is requested
- **WHEN** a notice that was collected before the rendering strategy shipped is requested from a detail endpoint
- **THEN** the system SHALL derive the rendered body from the stored raw content without requiring re-crawl or data migration

### Requirement: Rendering SHALL degrade safely for malformed bodies
The system SHALL provide a stable fallback when a source body is malformed, partially structured, or formatting rules fail to recover rich structure.

#### Scenario: cleaned HTML becomes empty
- **WHEN** the source-aware formatter removes invalid or unsupported HTML and no meaningful rich structure remains
- **THEN** the system SHALL fall back to readable paragraph output instead of returning broken markup

#### Scenario: text body lacks reliable explicit paragraph tags
- **WHEN** the text-first formatter cannot find stable HTML block tags in a source body
- **THEN** the system SHALL still emit paragraph-separated readable content using sentence, numbering, or field-boundary heuristics
