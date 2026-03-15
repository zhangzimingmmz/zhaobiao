# Enterprise Verification - Follow-up Work

This document records potential enhancements and follow-up work that are outside the scope of this change but may be valuable in the future.

## 1. OCR Prefill for Business License

**Description**: Automatically extract enterprise information from uploaded business license images using OCR technology.

**Benefits**:
- Reduces manual data entry
- Improves user experience
- Reduces input errors

**Implementation Considerations**:
- Requires integration with third-party OCR service (e.g., Baidu OCR, Tencent OCR, Aliyun OCR)
- Should be implemented as an enhancement, not a requirement
- Fallback to manual input if OCR fails
- User should be able to review and correct OCR results

**Suggested Approach**:
- Add optional OCR endpoint: `POST /api/ocr/business-license`
- Frontend calls OCR after image upload, prefills form fields
- User can modify any prefilled values before submission
- OCR failure doesn't block the submission flow

**Estimated Effort**: Medium (requires external service integration and error handling)

---

## 2. Enterprise Information Change Requests

**Description**: Allow approved enterprises to request changes to their verified information.

**Current Limitation**: Once approved, users cannot modify their enterprise information. The message says "如需变更请联系管理员".

**Potential Solution**:
- Add "申请变更" button for approved users
- Create a change request workflow similar to initial verification
- Admin reviews and approves/rejects change requests
- Maintain history of all changes for audit purposes

**Implementation Considerations**:
- Need to decide if changes take effect immediately or after approval
- Consider which fields can be changed (e.g., contact info vs. company name)
- May need separate table for change request history
- Should preserve original approved data until change is approved

**Suggested Approach**:
- Add `enterprise_change_requests` table
- Add new status: `change_pending`
- Admin review flow handles both initial applications and change requests
- Keep audit trail of all changes

**Estimated Effort**: Large (requires new data model, workflow, and admin UI)

---

## 3. Batch Upload for Multiple Business Licenses

**Description**: Allow users to upload multiple business licenses if they represent multiple enterprises.

**Current Limitation**: One user can only have one enterprise verification.

**Use Case**: Some users may manage multiple enterprises and want to verify all of them.

**Implementation Considerations**:
- Requires significant data model changes
- Need to decide on user-enterprise relationship (one-to-many)
- Profile page needs to support multiple enterprises
- May need enterprise switching mechanism
- Consider pricing/subscription implications

**Suggested Approach**:
- Add `user_enterprises` junction table
- Allow multiple active verifications per user
- Add enterprise selector in profile page
- Filter notices/favorites by selected enterprise

**Estimated Effort**: Very Large (major architectural change)

---

## 4. Real-time Notification for Audit Results

**Description**: Notify users immediately when their verification is approved or rejected.

**Current Limitation**: Users must manually check audit status page to see results.

**Potential Solutions**:
- WeChat template message notification
- In-app notification badge
- SMS notification
- Email notification (if email is collected)

**Implementation Considerations**:
- Requires notification service integration
- Need user consent for notifications
- Should be configurable (user can opt-in/opt-out)
- Consider notification frequency limits

**Suggested Approach**:
- Add notification preferences to user settings
- Trigger notification when admin updates application status
- Use WeChat template messages for miniapp
- Add notification history page

**Estimated Effort**: Medium (requires external service integration)

---

## 5. Enterprise Verification Progress Tracking

**Description**: Provide more detailed progress information during the review process.

**Current Limitation**: Users only see "审核中" without knowing which stage the review is at.

**Potential Enhancement**:
- Show review stages: "资料审核" → "信息核验" → "最终审批"
- Display estimated completion time
- Show which admin is reviewing (optional)
- Allow users to add supplementary materials during review

**Implementation Considerations**:
- Requires admin workflow to track review stages
- May need to add stage field to database
- Consider privacy implications of showing reviewer info

**Suggested Approach**:
- Add `review_stage` field to `enterprise_applications`
- Admin updates stage as they progress through review
- Frontend displays current stage in timeline
- Add estimated time based on historical data

**Estimated Effort**: Medium (requires admin workflow changes)

---

## 6. Automatic Credit Code Validation

**Description**: Validate unified social credit code against national enterprise database.

**Current Limitation**: Only format validation (18 digits), no verification of actual existence.

**Potential Solution**:
- Integrate with national enterprise credit information system
- Verify credit code exists and matches company name
- Check if enterprise is in good standing

**Implementation Considerations**:
- May require paid API access
- Need to handle API failures gracefully
- Consider rate limits and caching
- Privacy and data security concerns

**Suggested Approach**:
- Add optional validation step after form submission
- Show validation result to user before final submission
- Allow submission even if validation fails (with warning)
- Admin can see validation result during review

**Estimated Effort**: Large (requires external API integration and compliance review)

---

## 7. Bulk Import for Admin

**Description**: Allow admins to bulk import pre-verified enterprises.

**Use Case**: For migration from legacy systems or partnerships with verified enterprise lists.

**Implementation Considerations**:
- Need secure admin interface
- Requires data validation and error handling
- Should generate audit logs
- Consider data format (CSV, Excel, JSON)

**Suggested Approach**:
- Add admin bulk import page
- Support CSV/Excel upload with template
- Validate all rows before import
- Show import results with success/failure counts
- Send notifications to imported users

**Estimated Effort**: Medium (admin-only feature)

---

## 8. Enterprise Verification Expiration

**Description**: Require enterprises to renew their verification periodically.

**Use Case**: Ensure enterprise information stays up-to-date, especially for business license expiration.

**Implementation Considerations**:
- Need to define expiration period (e.g., 1 year, 3 years)
- Notify users before expiration
- Decide on grace period after expiration
- Consider impact on existing features

**Suggested Approach**:
- Add `expires_at` field to `enterprise_applications`
- Set expiration date based on business license validity
- Send renewal reminders 30/15/7 days before expiration
- Allow simplified renewal process (confirm existing info or update)

**Estimated Effort**: Medium (requires notification system and renewal workflow)

---

## Priority Recommendations

Based on user value and implementation complexity:

**High Priority** (consider for next iteration):
1. OCR Prefill - Significantly improves UX with moderate effort
2. Real-time Notification - Keeps users informed without requiring manual checks

**Medium Priority** (consider after initial launch):
3. Enterprise Information Change Requests - Important for long-term usability
4. Enterprise Verification Progress Tracking - Improves transparency

**Low Priority** (nice to have):
5. Automatic Credit Code Validation - Adds security but requires external dependencies
6. Bulk Import for Admin - Useful for migration but not critical for daily operations
7. Enterprise Verification Expiration - Important for compliance but can be added later

**Not Recommended** (major architectural changes):
8. Batch Upload for Multiple Business Licenses - Requires significant rework, unclear demand

---

## Notes

- All follow-up work should be tracked as separate changes/issues
- Each item should have its own design and implementation plan
- Consider user feedback after initial launch before prioritizing
- Some items may require legal/compliance review before implementation
