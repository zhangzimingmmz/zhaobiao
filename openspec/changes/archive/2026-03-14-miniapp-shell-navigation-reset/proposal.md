## Why

The miniapp still mixes two incompatible navigation models: a home-only custom shell and a separate legacy page family for profile, login, register, and detail pages. Until the global shell and entry structure are reset, page-level polish work will keep drifting because the app does not yet have a stable information architecture.

## What Changes

- Reset the primary miniapp information architecture around three first-level tabs: Home, Favorites, and Profile.
- Remove home-header favorite/profile actions that duplicate primary navigation.
- Define shared shell rules for primary-tab pages versus secondary pages that use back navigation.
- Prefer miniapp-native navigation behavior where it does not break critical interactions, and explicitly define when a custom page shell is still justified.
- **BREAKING** Supersede the previous assumption that favorites and profile are entered from home-header actions.

## Capabilities

### New Capabilities
- `miniapp-primary-navigation-shell`: Defines the three-tab primary navigation, route ownership, and page-family shell boundaries.
- `miniapp-page-family-headers`: Defines header variants for primary-tab pages and for secondary pages with back navigation.

### Modified Capabilities
- `miniapp-home-ui-parity`: Home parity now applies to the home content surface within the accepted primary shell rather than to a home-owned global navigation bar.
- `miniapp-home-platform-exceptions`: Platform exceptions now prefer miniapp-native tab structure unless it causes unacceptable interaction breakage.

## Impact

- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/app.config.ts`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/TopBar/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/components/BottomNav/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/index/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/favorites/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/profile/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/login/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/register/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/audit-status/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/detail/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/info-detail/*`
