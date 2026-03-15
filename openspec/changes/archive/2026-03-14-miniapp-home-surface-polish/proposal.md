## Why

Once the primary shell is reset, the home page still needs focused work on its content surface. Previous miniapp attempts mixed generic layouts, partial `ui` borrowing, and outdated rich-card assumptions, so the five home business states still do not feel intentionally designed.

## What Changes

- Rebuild the home content surface below the shared shell, state by state, instead of relying on generic fallback layouts.
- Align search, tabs, filter buttons, and overlay composition across engineering, procurement, and information states.
- Rework bid cards and info cards around the direct-field-only display policy.
- Define loading and empty states that preserve the active home-state rhythm instead of dropping to generic placeholders.
- Update parity verification so home comparison is judged inside the accepted miniapp shell rather than against shell-free screenshots.

## Capabilities

### New Capabilities
- `miniapp-home-filter-modes`: Defines the state-specific filter, search, and control composition for each supported home state.
- `miniapp-home-card-presentation`: Defines bid-card and info-card presentation rules under the direct-field-only display policy.
- `miniapp-home-loading-empty-states`: Defines loading and empty-state behavior for the home surface.

### Modified Capabilities
- `miniapp-home-parity-verification`: Home parity review now evaluates the home content surface inside the accepted shell and records shell-aware acceptance notes.

## Impact

- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/index/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/PrimaryTabs/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/SecondaryTabs/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/FilterBar/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/FilterSheet/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/BidCard/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/InfoCard/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/*Skeleton*`
- Home list-field normalization and empty-state handling
