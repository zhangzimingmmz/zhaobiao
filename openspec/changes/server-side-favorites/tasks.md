## 1. Backend Favorites Foundation

- [x] 1.1 Add a server-side favorites table and unique indexes for authenticated user-to-target relationships.
- [x] 1.2 Implement `GET /api/favorites` to return only still-resolvable notice and article favorites for the current logged-in user.
- [x] 1.3 Implement `POST /api/favorites/toggle` with authentication checks and stable target identification for `bid` and `info`.
- [x] 1.4 Expose a server-truth favorited status for detail/list surfaces, either via a dedicated status endpoint or by extending existing detail responses.

## 2. Miniapp Favorites Flow Migration

- [x] 2.1 Replace local favorites record storage as the primary data source with authenticated server requests in the favorites tab.
- [x] 2.2 Update home cards and detail pages so guest users cannot favorite and logged-in users toggle favorites through the server API.
- [x] 2.3 Keep only lightweight local UI state where still needed, such as favorites tab selection context, and remove obsolete device-level favorites assumptions.

## 3. Validation and Documentation

- [x] 3.1 Add backend tests covering authenticated toggle, duplicate prevention, and filtering out disappeared source records.
- [x] 3.2 Add miniapp verification coverage for guest gating, logged-in favorite toggling, and favorites tab empty/data states.
- [x] 3.3 Update API and project docs to state that favorites are account-level server data and that guests are not allowed to favorite.
