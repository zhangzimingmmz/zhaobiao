# Enterprise Verification Flow - Verification Checklist

This document outlines the five main paths that need to be verified for the enterprise verification redesign.

## Path 1: Unauthenticated User

**Scenario**: User is not logged in

**Steps**:
1. Open the miniapp without a token
2. Navigate to Profile page
3. Verify "未登录" state is shown
4. Click "去登录" button
5. Verify redirect to login page

**Expected Behavior**:
- Profile page shows guest card with "未登录" message
- No API calls to `/api/auth/audit-status` are made
- Login button redirects to `/pages/login/index`

**Backend**: N/A (frontend only)

---

## Path 2: No Application (status: none)

**Scenario**: User is logged in but has never submitted enterprise verification

**Steps**:
1. Login with a new user account
2. Navigate to Profile page
3. Verify enterprise info shows "—" and badge shows "未认证"
4. Verify status card shows "尚未提交企业认证"
5. Click "立即认证" button
6. Verify redirect to register page
7. Fill in minimal required fields (companyName, creditCode, licenseImage)
8. Submit the form

**Expected Behavior**:
- `GET /api/auth/audit-status` returns `{ status: "none", nextAction: "submit" }`
- Profile page shows "未认证" badge and "立即认证" CTA
- Register page allows submission with optional contactName and contactPhone
- `POST /api/auth/register` succeeds and returns status "pending"
- Redirect to audit-status page after successful submission

**Backend Verification**:
```bash
# Check audit-status for new user
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/audit-status
# Expected: { "code": 200, "data": { "status": "none", "nextAction": "submit" } }

# Submit enterprise verification
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"companyName":"测试企业","creditCode":"123456789012345678","licenseImage":"test.jpg"}' \
  http://localhost:8000/api/auth/register
# Expected: { "code": 200, "data": { "applicationId": "...", "status": "pending", ... } }
```

---

## Path 3: Pending Application (status: pending)

**Scenario**: User has submitted verification and it's under review

**Steps**:
1. After submitting in Path 2, verify audit-status page
2. Verify timeline shows "资料已提交" (done) and "平台审核中" (current)
3. Verify company info is displayed
4. Click "返回我的" button
5. Navigate back to Profile page
6. Verify badge shows "审核中"
7. Verify status card shows "企业认证审核中"
8. Click "查看审核状态" button
9. Try to access register page
10. Verify redirect to audit-status page with message "已有审核中的申请"

**Expected Behavior**:
- `GET /api/auth/audit-status` returns `{ status: "pending", nextAction: "view", ... }`
- Audit-status page shows pending timeline
- Profile page shows "审核中" badge and "查看审核状态" CTA
- Attempting to submit again returns 409 error
- Register page redirects to audit-status if user tries to access it

**Backend Verification**:
```bash
# Check pending status
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/audit-status
# Expected: { "code": 200, "data": { "status": "pending", "nextAction": "view", ... } }

# Try to submit again (should fail)
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"companyName":"测试企业2","creditCode":"123456789012345678","licenseImage":"test.jpg"}' \
  http://localhost:8000/api/auth/register
# Expected: { "code": 409, "message": "已有审核中的认证申请", "data": { "status": "pending" } }
```

---

## Path 4: Approved Application (status: approved)

**Scenario**: Admin has approved the enterprise verification

**Steps**:
1. Admin uses admin-enterprise-review-center to approve the application
2. User refreshes Profile page
3. Verify badge shows "已认证"
4. Verify no status card is shown (only approved info card)
5. Verify approved info card shows company details and audit time
6. Navigate to audit-status page
7. Verify "企业认证已通过" message
8. Click "进入首页" button
9. Try to access register page
10. Verify redirect with message "企业认证已通过"

**Expected Behavior**:
- `GET /api/auth/audit-status` returns `{ status: "approved", nextAction: "done", auditTime: "...", ... }`
- Profile page shows "已认证" badge and approved info card
- Audit-status page shows approved state
- Attempting to submit again returns 409 error
- Register page redirects to profile if user tries to access it

**Backend Verification**:
```bash
# Manually update status to approved (simulate admin approval)
sqlite3 data/notices.db "UPDATE enterprise_applications SET status='approved', audit_at='2026-03-15T10:00:00Z' WHERE user_id='<user_id>'"

# Check approved status
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/audit-status
# Expected: { "code": 200, "data": { "status": "approved", "nextAction": "done", "auditTime": "...", ... } }

# Try to submit again (should fail)
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"companyName":"测试企业3","creditCode":"123456789012345678","licenseImage":"test.jpg"}' \
  http://localhost:8000/api/auth/register
# Expected: { "code": 409, "message": "企业认证已通过，如需变更请联系管理员" }
```

---

## Path 5: Rejected Resubmission (status: rejected)

**Scenario**: Admin has rejected the application and user needs to resubmit

**Steps**:
1. Admin uses admin-enterprise-review-center to reject the application with a reason
2. User refreshes Profile page
3. Verify badge shows "审核未通过"
4. Verify status card shows "企业认证未通过" and reject reason
5. Click "重新提交" button
6. Verify register page is prefilled with previous data
7. Verify page title shows "重新提交企业认证"
8. Modify the data and resubmit
9. Verify successful submission and redirect to audit-status
10. Verify status is now "pending" again

**Expected Behavior**:
- `GET /api/auth/audit-status` returns `{ status: "rejected", nextAction: "resubmit", rejectReason: "...", ... }`
- Profile page shows "审核未通过" badge and "重新提交" CTA
- Register page prefills with previous data
- `POST /api/auth/register` updates existing application and resets status to "pending"
- Audit-status page shows pending state after resubmission

**Backend Verification**:
```bash
# Manually update status to rejected (simulate admin rejection)
sqlite3 data/notices.db "UPDATE enterprise_applications SET status='rejected', reject_reason='营业执照不清晰，请重新上传', audit_at='2026-03-15T10:00:00Z' WHERE user_id='<user_id>'"

# Check rejected status
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/audit-status
# Expected: { "code": 200, "data": { "status": "rejected", "nextAction": "resubmit", "rejectReason": "...", ... } }

# Resubmit with corrected data
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"companyName":"测试企业","creditCode":"123456789012345678","licenseImage":"new_clear_license.jpg"}' \
  http://localhost:8000/api/auth/register
# Expected: { "code": 200, "data": { "applicationId": "...", "status": "pending", ... } }

# Verify status is now pending
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/audit-status
# Expected: { "code": 200, "data": { "status": "pending", "nextAction": "view", ... } }
```

---

## Additional Verification Points

### Database Schema
- Verify `enterprise_applications` table has `updated_at` column
- Verify `contact_name` is nullable
- Verify single user can only have one current effective application

### Error Handling
- Verify 401 response when token is missing or invalid
- Verify 400 response for validation errors (missing fields, invalid format)
- Verify 409 response for duplicate submission attempts

### Field Validation
- `creditCode` must be exactly 18 characters
- `contactPhone` (if provided) must be 11 digits
- `companyName`, `creditCode`, `licenseImage` are required
- `contactName`, `contactPhone` are optional

### Default Behavior
- `contactPhone` defaults to logged-in user's mobile if not provided
- Rejected applications can be updated (not creating new records)
- Only one current effective application per user

---

## Notes for Admin Review Flow Integration

This verification assumes the admin review flow (`admin-enterprise-review-center` change) will:
1. Provide endpoints to update application status to `approved` or `rejected`
2. Set `audit_at` timestamp when status changes
3. Set `reject_reason` when rejecting an application

Until the admin review flow is implemented, manual database updates can be used to simulate admin actions for testing.
