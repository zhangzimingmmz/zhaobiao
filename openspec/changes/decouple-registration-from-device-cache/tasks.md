## 1. Register Entry Flow

- [x] 1.1 Remove the register-page startup logic that reads device-local registration context and auto-queries audit status before the user submits anything.
- [x] 1.2 Keep the register page usable as a fresh form on every visit, including on devices that already submitted another account before.

## 2. Registration Context Scope

- [x] 2.1 Reduce `registrationContext` usage to immediate post-submit flow support only, instead of long-term control over later register-page entry.
- [x] 2.2 Clear or ignore stale registration context at the appropriate lifecycle points so later register-page visits are not auto-hijacked by old applications.

## 3. Login-based Status Routing

- [x] 3.1 Verify and adjust the login success flow so account status is always determined after authentication, not before.
- [x] 3.2 Preserve the existing post-login routing for `approved`, `pending`, `rejected`, and `none`, with clear user-facing toasts before navigation.

## 4. Validation

- [x] 4.1 Verify that the same device can open the register page repeatedly and register a different account without being auto-redirected by previous application state.
- [x] 4.2 Verify that logging in with approved, pending, and rejected accounts still routes to the correct page after the register-page auto-restore logic is removed.
