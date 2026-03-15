## 1. Contract and data model updates

- [x] 1.1 Update the auth register contract and request validation to use the minimal enterprise verification field set.
- [x] 1.2 Update the audit-status contract to return a unified `none|pending|approved|rejected` state machine with `nextAction`.
- [x] 1.3 Adjust the enterprise application persistence strategy to support one current effective application per user.

## 2. Backend enterprise verification behavior

- [x] 2.1 Require a valid logged-in user context for enterprise verification submission.
- [x] 2.2 Implement duplicate-submission rules for pending, rejected-resubmit, and approved users.
- [x] 2.3 Return normalized enterprise verification snapshots from `POST /api/auth/register` and `GET /api/auth/audit-status`.

## 3. Miniapp verification flow

- [x] 3.1 Redesign the register page around the simplified field set and default contact-phone behavior.
- [x] 3.2 Update the audit-status page to consume the unified state machine instead of legacy no-record branching.
- [x] 3.3 Update the profile page so enterprise verification CTAs follow `nextAction` and the new status model.

## 4. Verification and documentation

- [x] 4.1 Update frontend/back-end docs so the enterprise verification flow, fields, and statuses match the new contract.
- [x] 4.2 Verify the five main paths: unauthenticated, no application, pending, approved, and rejected resubmission, using review results produced by the admin review flow.
- [x] 4.3 Record any justified follow-up work, such as OCR prefill or enterprise-info change requests, outside this change.
