## ADDED Requirements

### Requirement: Profile SHALL stay on profile tab after logout
When the user logs out, the profile tab SHALL remain on the profile page and display the guest login form, without redirecting to another page.

#### Scenario: User logs out
- **WHEN** the authenticated user taps the logout button and confirms
- **THEN** the profile surface SHALL clear token and audit-related state (auditData, auditStatus, nextAction)
- **AND** the profile surface SHALL render the guest state with login form

### Requirement: Profile authenticated header SHALL show avatar, legal person name, phone, and status badge
The authenticated profile header SHALL display an avatar (generated from legal person name), large legal person name, smaller phone number, and a status badge (e.g. "已通过" with green styling for approved).

#### Scenario: Approved user views profile
- **WHEN** the authenticated user has approved certification
- **THEN** the header SHALL show AvatarInitials, legal person name (法人姓名), mobile number, and a green "已通过" badge

#### Scenario: Pending or rejected user views profile
- **WHEN** the authenticated user has pending or rejected certification
- **THEN** the header SHALL show the same layout with appropriate badge text and color (e.g. "审核中" / "未通过")

### Requirement: Profile data summary SHALL use flex layout with label-value pairs
The data summary card SHALL display login name, business license code (营业执照代码), and audit time in a flex layout with left-aligned gray labels and right-aligned darker values. It SHALL NOT duplicate the phone number (already shown in header).

#### Scenario: Approved user views data summary
- **WHEN** the authenticated user has approved certification
- **THEN** the summary SHALL show: 登录名, 营业执照代码, 审核时间
- **AND** each row SHALL use justify-between with label on left (gray) and value on right (darker, right-aligned)

### Requirement: Profile function list items SHALL have left icon and right chevron
The function list (e.g. 设置, 联系客服) SHALL display a line-style icon on the left and a chevron-right icon on the right to convey clickability.

#### Scenario: Function list is rendered
- **WHEN** the profile surface shows the function list
- **THEN** each item SHALL have an icon on the left and a chevron-right on the right
- **AND** the list SHALL appear clearly clickable

### Requirement: Profile logout button SHALL have distinct visual boundary
The logout button SHALL be rendered as an independent white card or light red background button, with red text, centered, and clear visual boundary.

#### Scenario: Logout button is rendered
- **WHEN** the authenticated user views the profile
- **THEN** the logout control SHALL be visually distinct (card or bordered button)
- **AND** the text SHALL use red color (e.g. $color-error)
