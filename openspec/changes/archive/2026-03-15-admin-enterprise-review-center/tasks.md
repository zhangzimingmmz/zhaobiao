## 1. Admin review API foundation

- [x] 1.1 Add minimal admin authentication/authorization for enterprise review endpoints.
- [x] 1.2 Extend enterprise application storage with audit metadata needed for review actions.
- [x] 1.3 Implement admin review list/detail/approve/reject APIs.

## 2. Admin review surfaces

- [x] 2.1 Add `/admin/reviews` review queue and detail flow in the existing UI workspace.
- [x] 2.2 Add `/admin/companies` company directory with status filtering and latest application summary.
- [x] 2.3 Ensure review actions write standard approved/rejected results consumed by the user-facing flow.

## 3. Verification and docs

- [x] 3.1 Document the admin review endpoints, auth model, and enterprise audit metadata.
- [x] 3.2 Verify end-to-end review flow: submit, pending, approve, reject, and user-side status refresh.
- [x] 3.3 Capture follow-up gaps, such as richer admin roles or enterprise change-request workflows, outside this change.
