## 1. Backend Access Foundation

- [x] 1.1 Implement `POST /api/admin/login` with fixed username and password validation for the single operator
- [x] 1.2 Define the admin login response contract and frontend storage strategy for long-lived local login
- [x] 1.3 Decide and document whether the admin dashboard uses frontend aggregation or a dedicated `GET /api/admin/dashboard` interface

## 2. Admin Frontend Project Setup

- [x] 2.1 Create the `admin-frontend/` project in the current repository and define its local development entry
- [x] 2.2 Implement the minimal shell with simple navigation, page title area, and basic loading, empty, and error states
- [x] 2.3 Implement protected routing so unauthenticated users are redirected to the admin login page

## 3. Minimal First-Phase Pages

- [x] 3.1 Implement the admin login page
- [x] 3.2 Implement the dashboard page with pending review count and recent crawl run summary
- [x] 3.3 Implement the enterprise review list page
- [x] 3.4 Implement the enterprise review detail page with approve and reject actions
- [x] 3.5 Implement the company directory page
- [x] 3.6 Implement the crawl console page
- [x] 3.7 Implement the run history page
- [x] 3.8 Implement the run detail page

## 4. Existing Admin API Wiring

- [x] 4.1 Connect enterprise review pages to `/api/admin/reviews`, `/api/admin/reviews/{id}`, `/approve`, and `/reject`
- [x] 4.2 Connect the company directory page to `/api/admin/companies`
- [x] 4.3 Connect crawl pages to `/api/admin/crawl/actions`, `/api/admin/crawl/runs`, and `/api/admin/crawl/runs/{id}`
- [x] 4.4 Connect dashboard data to the agreed minimal data source strategy

## 5. Gap Control and Scope Verification

- [x] 5.1 Record every missing field or missing backend interface discovered during page wiring
- [x] 5.2 Keep the implementation limited to the agreed eight first-phase pages and reject scope creep
- [x] 5.3 Re-check that the final task plan still matches the latest simplified Chinese admin requirements document
