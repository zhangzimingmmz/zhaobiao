# Unified Admin Frontend Core: Implementation Gap Report

## 1. Project Location, Stack, and Entry

- Frontend project location: `admin-frontend/`
- Stack: React 18 + Vite 5 + TypeScript + Ant Design + Pro Components
- Local development entry:
  - `cd admin-frontend`
  - `npm install`
  - `npm run dev`

This is now documented in `admin-frontend/README.md`.

## 2. Existing API Coverage Wired Into First-Phase Pages

Current first-phase pages are wired to these existing backend endpoints:

- Dashboard
  - `GET /api/admin/reviews`
  - `GET /api/admin/crawl/runs`
- Enterprise review queue
  - `GET /api/admin/reviews`
- Enterprise review detail
  - `GET /api/admin/reviews/{id}`
  - `POST /api/admin/reviews/{id}/approve`
  - `POST /api/admin/reviews/{id}/reject`
- Company directory
  - `GET /api/admin/companies`
- Company detail placeholder page
  - Reuses `GET /api/admin/reviews/{id}` as the nearest read-only source
- Crawl console
  - `GET /api/admin/crawl/actions`
  - `POST /api/admin/crawl/runs`
- Run history
  - `GET /api/admin/crawl/runs`
- Run detail
  - `GET /api/admin/crawl/runs/{id}`

## 3. Missing API / Field / Permission Gaps

The current admin frontend still lacks dedicated backend support for:

- A dedicated dashboard aggregation endpoint such as `GET /api/admin/dashboard`
- A dedicated company detail endpoint separate from review detail
- Rich operator notes / case history attached to companies
- Crawl health widgets, freshness summaries, and alert aggregation
- Finer-grained admin permission scopes beyond the current lightweight admin session model
- A dedicated API-unavailable capability contract from the backend

## 4. Placeholder and Read-Only Decisions

The following first-phase pages or sections are intentionally allowed to ship as placeholder or read-only states:

- Dashboard health expansion cards:
  - Placeholder until dedicated health and alert APIs exist
- Company detail page:
  - Read-only structure backed by the nearest available review-detail payload
  - Missing sections shown as placeholder cards
- Crawl extension area:
  - Placeholder for future health-center and conflict-analysis capabilities

The following pages should remain fully functional in phase one and are not placeholder-only:

- Admin shell and protected entry path
- Dashboard core summary
- Enterprise review list and detail actions
- Company directory list
- Crawl action submission
- Run history and run detail

## 5. Information Architecture Validation

The implemented information architecture still matches the workflow defined in this change:

1. Dashboard
2. Enterprise review
3. Company directory
4. Crawl control
5. Run history / run detail

This structure keeps the admin frontend organized by operator workflow rather than by backend technical boundaries.
