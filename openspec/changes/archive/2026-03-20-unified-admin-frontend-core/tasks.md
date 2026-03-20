## 1. Admin Frontend Foundation

- [x] 1.1 Define the new admin frontend project location, stack, and local development entry inside the current repository
- [x] 1.2 Create the initial admin frontend application shell with route structure for dashboard, enterprise review, company directory, crawl control, and run history
- [x] 1.3 Add shared global states for loading, empty, error, unauthorized, and API-unavailable pages
- [x] 1.4 Add environment marking and protected-route entry behavior for admin access

## 2. Dashboard and Navigation

- [x] 2.1 Implement the top-level navigation and layout so operators can move between all first-phase modules
- [x] 2.2 Build the operations dashboard page with cards or sections for pending reviews, crawl freshness, and recent failures
- [x] 2.3 Add shortcut actions from the dashboard into enterprise review and crawl operation workflows
- [x] 2.4 Add placeholder or partial-data widgets for dashboard sections that do not yet have full backend support

## 3. Enterprise Operations

- [x] 3.1 Implement the enterprise review list page with status-oriented browsing
- [x] 3.2 Implement the enterprise review detail page with enterprise materials, status context, and approve or reject actions
- [x] 3.3 Implement the company directory page with searchable or filterable enterprise records
- [x] 3.4 Implement the company detail page structure with placeholders for fields that are not yet fully backed by APIs

## 4. Crawl Operations

- [x] 4.1 Implement the crawl operations console page with supported action discovery and parameter input
- [x] 4.2 Implement the run history page with filtering by site, action, and status
- [x] 4.3 Implement the run detail page with execution summary, parameters, status, and failure context
- [x] 4.4 Add clear restricted, unavailable, or pending-backend states for crawl sections that are not fully supported yet

## 5. Backend Integration and Gap Closure

- [x] 5.1 Connect the first-phase pages to existing `/api/admin/*` endpoints that already exist in `server`
- [x] 5.2 Document every missing API, field, or permission gap discovered while wiring the planned pages
- [x] 5.3 Decide which first-phase pages can ship as read-only or placeholder states before missing APIs are added
- [x] 5.4 Validate that the final information architecture still matches the unified operator workflow defined in this change
