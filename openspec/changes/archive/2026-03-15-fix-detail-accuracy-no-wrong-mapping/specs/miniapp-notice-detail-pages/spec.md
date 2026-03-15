# Spec: miniapp-notice-detail-pages (delta)

## ADDED Requirements

### Requirement: 查看原文按钮 SHALL 在卡片内正确对齐

招投标详情页与信息详情页的「查看原文」按钮 SHALL 不超出其所在卡片的边界，与卡片内其他内容对齐一致，无横向溢出或错位。

#### Scenario: 按钮不溢出卡片

- **WHEN** 用户查看有 originUrl 的详情页
- **THEN** 「查看原文」按钮的右边缘 SHALL 不超出卡片内容区域的右边缘
