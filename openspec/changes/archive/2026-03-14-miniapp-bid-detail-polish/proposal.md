## Why

The current bid detail page has a usable skeleton, but it is still generic in layout, field mapping, and favorite behavior compared with the reference UI. Separating bid-detail polish from the larger alignment effort makes it easier to implement stable-field rendering and favorites synchronization without bundling unrelated home-page work.

## What Changes

- Polish the bid detail header so it presents the notice tag, title, source, and publish time in a consistent card layout.
- Normalize the project information and important time sections around stable detail fields already defined by the data model.
- Keep the detail body focused on raw `content` and the original-link action instead of content-derived structured fields.
- Persist the bid detail favorite state using the same storage contract as the favorites page.
- Update the detail top bar to support the reference-style back and favorite actions.

## Capabilities

### New Capabilities
- `miniapp-bid-detail-view`: Structured bid detail view with header, information sections, content, and original-link action.
- `miniapp-bid-detail-favorite`: Favorite toggle behavior and persistence for bid detail records.

### Modified Capabilities

None.

## Impact

- `miniapp/src/pages/detail/index.tsx`
- `miniapp/src/pages/detail/index.scss`
- `miniapp/src/pages/detail/index.config.ts`
- `miniapp/src/components/TopBar/*`
- Shared favorites storage helper used by the detail page
- Bid detail field mapping from `/api/detail/bid/:id`
