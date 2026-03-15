## Why

The miniapp’s secondary pages still belong to the older visual family: login, register, and audit-status use oversized blue shells, while detail pages remain generic and disconnected from the emerging favorites model. These pages now need a coordinated redesign around the new secondary-page family.

## What Changes

- Redesign login and register around a shared secondary-page form pattern instead of the older blue hero shell.
- Redesign audit-status around explicit pending, approved, and rejected state cards inside the same secondary-page family.
- Redesign bid detail and information detail around a shared secondary-page content pattern with page-local actions.
- Keep favorite/share/original-link actions scoped to detail pages instead of pushing them into the global shell.

## Capabilities

### New Capabilities
- `miniapp-auth-page-family`: Defines the shared design rules for login and register pages.
- `miniapp-audit-status-page`: Defines the audit-status page states and next actions.
- `miniapp-notice-detail-pages`: Defines bid detail and information detail page structure, local actions, and favorites integration expectations.

### Modified Capabilities

None.

## Impact

- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/login/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/register/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/audit-status/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/detail/*`
- `/Users/zhangziming/opt/projects/zhaobiao/miniapp/src/pages/info-detail/*`
- Shared secondary-page header components and favorites storage integration points
