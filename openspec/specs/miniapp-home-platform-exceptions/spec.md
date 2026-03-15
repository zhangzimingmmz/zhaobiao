# miniapp-home-platform-exceptions Specification

## Purpose
TBD - created by archiving change miniapp-home-ui-faithful. Update Purpose after archive.
## Requirements
### Requirement: Platform-driven deviations SHALL be explicit and minimal
The miniapp home page SHALL deviate from the `ui` reference only when the miniapp runtime prevents the reference behavior, and each deviation SHALL preserve the closest possible visual hierarchy and interaction intent.

#### Scenario: Safe-area and capsule collision
- **WHEN** the `ui` top-bar spacing would collide with the miniapp status area or capsule region
- **THEN** the miniapp SHALL add the minimum platform-specific offset needed to avoid overlap while preserving the `ui` visual hierarchy

#### Scenario: Native chrome conflict
- **WHEN** native miniapp chrome or runtime layering prevents the `ui` structure from rendering correctly
- **THEN** the miniapp SHALL use the closest page-level replacement instead of silently accepting broken hierarchy

### Requirement: Overlay continuity SHALL take precedence over native tab-bar convenience
If the native miniapp `tabBar` breaks the intended home overlay experience, the implementation MUST prefer the recommended page-level navigation shell for the affected surfaces.

#### Scenario: Bottom sheet conflicts with native tab bar
- **WHEN** a filter sheet cannot visually cover or coordinate with the bottom navigation because of native `tabBar` layering
- **THEN** the recommended implementation SHALL replace the conflicting bottom navigation treatment with a page-rendered shell that restores overlay continuity

#### Scenario: Native tab bar does not block parity
- **WHEN** the native `tabBar` does not break the intended home hierarchy or overlays
- **THEN** the miniapp MAY retain it as a platform-compatible implementation choice


<!-- merged from miniapp-shell-navigation-reset -->

### Requirement: Overlay continuity SHALL take precedence over native tab-bar convenience
If the native miniapp `tabBar` breaks the accepted home interaction model in a way that cannot be resolved within the miniapp-native shell, the implementation MUST use the closest replacement that preserves the intended hierarchy. Otherwise, the implementation SHALL prefer the native first-level navigation structure.

#### Scenario: Native tab bar remains acceptable
- **WHEN** the native `tabBar` supports the accepted home hierarchy and overlay behavior with only minor platform adaptation
- **THEN** the miniapp SHALL retain the native first-level navigation structure

#### Scenario: Native tab bar causes unacceptable interaction breakage
- **WHEN** a home overlay cannot coexist with the accepted navigation model because of native tab-bar layering or runtime behavior
- **THEN** the implementation SHALL use the closest page-level replacement needed to restore the accepted interaction hierarchy
