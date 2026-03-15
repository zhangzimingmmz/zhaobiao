## MODIFIED Requirements

### Requirement: Overlay continuity SHALL take precedence over native tab-bar convenience
If the native miniapp `tabBar` breaks the accepted home interaction model in a way that cannot be resolved within the miniapp-native shell, the implementation MUST use the closest replacement that preserves the intended hierarchy. Otherwise, the implementation SHALL prefer the native first-level navigation structure.

#### Scenario: Native tab bar remains acceptable
- **WHEN** the native `tabBar` supports the accepted home hierarchy and overlay behavior with only minor platform adaptation
- **THEN** the miniapp SHALL retain the native first-level navigation structure

#### Scenario: Native tab bar causes unacceptable interaction breakage
- **WHEN** a home overlay cannot coexist with the accepted navigation model because of native tab-bar layering or runtime behavior
- **THEN** the implementation SHALL use the closest page-level replacement needed to restore the accepted interaction hierarchy
