# Spec: admin-frontend-ui-framework

## ADDED Requirements

### Requirement: 运营后台表单控件 SHALL 使用 Ant Design 组件

运营后台中所有表单类交互（输入、选择、提交）MUST 使用 antd 的 Form、Input、Select、Button 等组件，SHALL NOT 使用原生 `<input>`、`<select>`、`<button>` 搭配自定义 CSS 类实现表单功能。

#### Scenario: 登录页使用 Form 与 Input
- **WHEN** 用户访问登录页
- **THEN** 账号与密码输入框由 antd Input 渲染，提交按钮由 antd Button 渲染，整体由 Form 管理

#### Scenario: 采集控制页使用 Form 与 Select
- **WHEN** 用户访问采集控制页
- **THEN** 动作选择、参数输入由 Form.Item + Select/Input 实现，提交按钮由 Button 实现

### Requirement: 运营后台表格与列表 SHALL 使用 ProTable 或 antd Table

运营后台中所有表格类展示（含分页、筛选）MUST 使用 ProTable 或 antd Table 组件，SHALL NOT 使用原生 `<table>` 搭配自定义 CSS 实现数据列表。

#### Scenario: 内容管理页使用 ProTable
- **WHEN** 用户访问内容管理页
- **THEN** 文章列表由 ProTable 渲染，支持状态/分类筛选、分页、操作列

#### Scenario: 运行记录页使用 ProTable
- **WHEN** 用户访问运行记录页
- **THEN** 运行记录列表由 ProTable 渲染，支持状态/站点筛选、分页

#### Scenario: 总览页表格使用 Table
- **WHEN** 用户访问总览页
- **THEN** 最近运行列表由 antd Table 或 ProTable 渲染

### Requirement: 运营后台详情展示 SHALL 使用 Card 与 Descriptions

运营后台中键值对类详情展示（如运行详情、审核详情中的企业信息）MUST 使用 antd Card 与 Descriptions 组件，SHALL NOT 使用纯 `<div>` + 自定义 `detail-grid` 类实现。

#### Scenario: 运行详情页使用 Card 与 Descriptions
- **WHEN** 用户访问运行详情页
- **THEN** 动作、状态、站点、请求时间等由 Descriptions 展示，整体由 Card 包裹

#### Scenario: 审核详情页使用 Card 与 Button
- **WHEN** 用户访问审核详情页
- **THEN** 驳回原因输入使用 Input.TextArea，操作按钮使用 antd Button

### Requirement: 运营后台反馈 SHALL 使用 message 与 Modal

运营后台中成功/失败提示 MUST 使用 `message.success()`、`message.error()` 等，确认类交互 MUST 使用 `Modal.confirm()`，SHALL NOT 使用 `alert()` 或 `confirm()`。

#### Scenario: 操作成功提示
- **WHEN** 用户完成发布、下线、删除等操作
- **THEN** 系统通过 message 展示成功或失败提示

#### Scenario: 删除确认
- **WHEN** 用户点击删除按钮
- **THEN** 系统通过 Modal.confirm 展示确认对话框，而非原生 confirm
