## ADDED Requirements

### Requirement: 企业管理页面支持状态筛选
企业管理页面 SHALL 提供状态筛选器，允许管理员按审核状态筛选企业列表。筛选器 SHALL 支持以下状态：pending（待审核）、approved（已通过）、rejected（已驳回）、以及 all（全部）。

#### Scenario: 默认显示全部企业
- **WHEN** 管理员首次打开企业管理页面
- **THEN** 系统显示所有状态的企业（不应用任何状态筛选）
- **AND** 筛选器默认选中 "全部" 选项

#### Scenario: 按待审核状态筛选
- **WHEN** 管理员在筛选器中选择 "待审核"
- **THEN** 系统仅显示 status=pending 的企业
- **AND** 列表自动刷新显示筛选结果

#### Scenario: 按已通过状态筛选
- **WHEN** 管理员在筛选器中选择 "已通过"
- **THEN** 系统仅显示 status=approved 的企业
- **AND** 列表自动刷新显示筛选结果

#### Scenario: 按已驳回状态筛选
- **WHEN** 管理员在筛选器中选择 "已驳回"
- **THEN** 系统仅显示 status=rejected 的企业
- **AND** 列表自动刷新显示筛选结果

#### Scenario: 切换回全部状态
- **WHEN** 管理员在筛选器中选择 "全部"
- **THEN** 系统显示所有状态的企业
- **AND** 移除 status 参数的 API 调用

### Requirement: 筛选状态持久化
筛选器的选中状态 SHALL 在页面刷新后保持，使用 URL 查询参数或本地存储实现。

#### Scenario: 刷新页面保持筛选状态
- **WHEN** 管理员选择 "待审核" 筛选后刷新页面
- **THEN** 页面重新加载后仍显示待审核企业
- **AND** 筛选器仍选中 "待审核" 选项

### Requirement: 筛选器与分页联动
状态筛选 SHALL 与分页功能正确联动，切换筛选条件时重置到第一页。

#### Scenario: 切换筛选条件重置分页
- **WHEN** 管理员在第 3 页时切换筛选条件
- **THEN** 系统自动跳转到第 1 页
- **AND** 显示新筛选条件下的第 1 页数据
