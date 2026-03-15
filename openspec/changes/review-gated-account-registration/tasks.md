## 1. Database And Data Model

- [x] 1.1 Add idempotent schema migration for `users` to include `username`, `password_hash`, `account_status`, and `updated_at`
- [x] 1.2 Extend `enterprise_applications` with `legal_person_name`, `legal_person_phone`, `business_scope`, and `business_address`
- [x] 1.3 Ensure uniqueness and lookup paths for `username` and latest `applicationId` are enforced in SQLite queries

## 2. User Auth APIs

- [x] 2.1 Rewrite `POST /api/auth/register` as anonymous registration that creates a pending account and application record
- [x] 2.2 Rewrite `POST /api/auth/login` to use `username` and `password`, returning token only for `approved` accounts
- [x] 2.3 Redefine `GET /api/auth/audit-status` to query by registration identifiers instead of Bearer token
- [x] 2.4 Update JWT payload creation and auth helpers to match the new account model

## 3. Admin Review Flow

- [x] 3.1 Expand admin review list/detail responses to expose the new enterprise registration fields
- [x] 3.2 Update admin approve/reject handlers to synchronize `users.account_status` with review outcomes
- [x] 3.3 Verify non-admin requests remain blocked from `/api/admin/*` review endpoints

## 4. Miniapp Auth And Routing

- [x] 4.1 Replace miniapp login form fields and service calls from phone-captcha to username-password
- [x] 4.2 Expand miniapp register form to capture all required account and enterprise review fields
- [x] 4.3 Update login result routing so pending accounts go to audit status, rejected accounts go to resubmission, and only approved accounts enter the home page
- [x] 4.4 Update audit-status and profile flows to use registration identifiers instead of login token for pending or rejected accounts

## 5. Verification

- [x] 5.1 Verify registration creates a pending account and returns an `applicationId`
- [x] 5.2 Verify pending and rejected accounts cannot obtain login tokens and receive the correct status responses
- [x] 5.3 Verify approved accounts can log in successfully and admin review actions correctly transition account status
