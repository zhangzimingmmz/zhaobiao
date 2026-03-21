# miniapp-home-ui-parity Specification

## Purpose
定义小程序首页在业务结构层面与 `ui` 参考保持一致的范围,同时允许首页采用更新的视觉层级与频道化壳层。

## Requirements
### Requirement: Home page SHALL follow the `ui` reference by default
The miniapp home page SHALL preserve the accepted business-state structure from the `ui` reference, but it SHALL NOT be required to visually mimic the older default segmented-control stack. The home page SHALL be free to rebuild the visual hierarchy into a more modern channel-led composition as long as the supported state ordering and content ownership remain clear.

#### Scenario: Engineering home state
- **WHEN** the user is in the engineering primary state and engineering secondary state
- **THEN** the miniapp SHALL present the engineering home content in a clear channel-led hierarchy that still includes the supported engineering controls, search, filters, and list cards without degrading into an older generic query-panel appearance

#### Scenario: Government procurement state
- **WHEN** the user is in the government procurement primary state and switches between intention and announcement secondary states
- **THEN** the miniapp SHALL preserve the supported procurement-state structure while allowing a redesigned visual hierarchy instead of forcing the previous stacked segmented-control rendering

#### Scenario: Information state
- **WHEN** the user is in the information primary state
- **THEN** the miniapp SHALL keep the information-state hierarchy appropriate to that content while using the redesigned home visual language rather than inheriting the denser engineering/procurement control stack

### Requirement: Home overlays SHALL follow the `ui` interaction model by default
The miniapp home page SHALL present filter overlays and related transitions according to the accepted home interaction model unless a documented platform exception applies.

#### Scenario: Time filter overlay
- **WHEN** the user opens the time filter from a home state that supports it
- **THEN** the miniapp SHALL present a bottom overlay with the same information hierarchy as the accepted home interaction model

#### Scenario: Region or source overlay
- **WHEN** the user opens a region or source filter from a supported home state
- **THEN** the miniapp SHALL present the overlay as part of the same home interaction model instead of degrading it into a visually unrelated picker flow
