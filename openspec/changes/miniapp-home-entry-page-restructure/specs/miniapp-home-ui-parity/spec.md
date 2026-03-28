# miniapp-home-ui-parity Specification

## Purpose
定义小程序首页在入口结构层面与目标稿保持一致的范围，使首页成为“品牌横幅 + 三入口”的频道入口页，而不是带搜索和说明模块的混合平台首页。

## MODIFIED Requirements

### Requirement: Home page SHALL follow the `ui` reference by default
The miniapp home page SHALL follow the accepted `ui` reference as a channel-entry page. Instead of preserving a mixed platform-home structure, the home page SHALL use a dedicated brand hero followed immediately by the three primary channel entry cards, with no extra explainer modules between or after them.

#### Scenario: Home entry page is rendered
- **WHEN** the authenticated user opens the home page
- **THEN** the page SHALL render a brand hero first and the three primary channel entry cards second, matching the accepted entry-page structure rather than the previous search-plus-explainer layout

#### Scenario: Home content ownership is evaluated
- **WHEN** the home page content tree is composed
- **THEN** the home page SHALL NOT render the old search prompt block, platform explanation band, or per-card subtitle explainer copy as part of the accepted home structure

### Requirement: Home overlays SHALL follow the `ui` interaction model by default
The miniapp home page SHALL present filter overlays and related transitions according to the accepted home interaction model unless a documented platform exception applies.

#### Scenario: Time filter overlay
- **WHEN** the user opens the time filter from a home state that supports it
- **THEN** the miniapp SHALL present a bottom overlay with the same information hierarchy as the accepted home interaction model

#### Scenario: Region or source overlay
- **WHEN** the user opens a region or source filter from a supported home state
- **THEN** the miniapp SHALL present the overlay as part of the same home interaction model instead of degrading it into a visually unrelated picker flow
