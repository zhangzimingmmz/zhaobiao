## 1. Admin Frontend Foundation

- [ ] 1.1 Define the new admin frontend project location, stack, and local development entry inside the current repository
- [ ] 1.2 Create the initial admin frontend application shell with route structure for dashboard, enterprise review, company directory, crawl control, and run history
- [ ] 1.3 Add shared global states for loading, empty, error, unauthorized, and API-unavailable pages
- [ ] 1.4 Add environment marking and protected-route entry behavior for admin access

## 2. Dashboard and Navigation

- [ ] 2.1 Implement the top-level navigation and layout so operators can move between all first-phase modules
- [ ] 2.2 Build the operations dashboard page with cards or sections for pending reviews, crawl freshness, and recent failures
- [ ] 2.3 Add shortcut actions from the dashboard into enterprise review and crawl operation workflows
- [ ] 2.4 Add placeholder or partial-data widgets for dashboard sections that do not yet have full backend support

## 3. Enterprise Operations

- [ ] 3.1 Implement the enterprise review list page with status-oriented browsing
- [ ] 3.2 Implement the enterprise review detail page with enterprise materials, status context, and approve or reject actions
- [ ] 3.3 Implement the company directory page with searchable or filterable enterprise records
- [ ] 3.4 Implement the company detail page structure with placeholders for fields that are not yet fully backed by APIs

## 4. Crawl Operations

- [ ] 4.1 Implement the crawl operations console page with supported action discovery and parameter input
- [ ] 4.2 Implement the run history page with filtering by site, action, and status
- [ ] 4.3 Implement the run detail page with execution summary, parameters, status, and failure context
- [ ] 4.4 Add clear restricted, unavailable, or pending-backend states for crawl sections that are not fully supported yet

## 5. Backend Integration and Gap Closure

- [ ] 5.1 Connect the first-phase pages to existing `/api/admin/*` endpoints that already exist in `server`
- [ ] 5.2 Document every missing API, field, or permission gap discovered while wiring the planned pages
- [ ] 5.3 Decide which first-phase pages can ship as read-only or placeholder states before missing APIs are added
- [ ] 5.4 Validate that the final information architecture still matches the unified operator workflow defined in this change
