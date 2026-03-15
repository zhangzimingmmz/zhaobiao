## Why

The current miniapp home page is functional but not visually faithful to the `ui` reference, and the last alignment pass optimized for reusable components instead of reference-level parity. We need a new change that treats `ui` as the default visual and interaction source of truth for the home surface, while explicitly allowing only two kinds of deviation: miniapp platform constraints and business-rule conflicts.

## What Changes

- Re-scope home alignment around reference fidelity instead of generic component completion.
- Define the `ui` home experience as the default source of truth for layout, spacing, hierarchy, filter behavior, card density, and overlay presentation.
- Identify the miniapp-specific exception rules that are allowed to override the `ui` reference, such as safe-area handling, native container constraints, and unsupported overlay behavior.
- Identify the business-rule exception rules that are allowed to override the `ui` reference, such as not displaying inferred fields or content-derived structure when the data contract does not provide them directly.
- Add an explicit acceptance model for home-state verification so engineering and review can judge parity state-by-state instead of by general impression.

## Capabilities

### New Capabilities
- `miniapp-home-ui-parity`: Defines the home page states that must match the `ui` reference in structure, hierarchy, and presentation.
- `miniapp-home-platform-exceptions`: Defines the limited cases where miniapp platform constraints may justify a controlled deviation from the `ui` reference.
- `miniapp-home-business-display-policy`: Defines the field-display rules that override the `ui` reference when business data rules conflict with the demo presentation.
- `miniapp-home-parity-verification`: Defines the acceptance and comparison criteria for validating visual and interaction parity across home states and filter overlays.

### Modified Capabilities

None.

## Impact

- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/index/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/TopBar/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/PrimaryTabs/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/SecondaryTabs/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/FilterBar/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/FilterSheet/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/BidCard/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/InfoCard/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/app.config.ts`
- `/Users/zhangziming/opt/projects/zhaobiao/ui/src/app/pages/Home.tsx`
- `/Users/zhangziming/opt/projects/zhaobiao/ui/src/app/components/*`
