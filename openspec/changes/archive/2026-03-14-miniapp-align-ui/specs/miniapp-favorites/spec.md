## ADDED Requirements

### Requirement: 收藏列表页
系统 SHALL 提供收藏列表页面，展示用户收藏的招投标/信息项。

#### Scenario: 进入收藏页
- **WHEN** 用户从首页点击收藏图标进入收藏页
- **THEN** 显示收藏列表，支持按类型切换（招标计划/招标公告/采购公告）

#### Scenario: 类型切换
- **WHEN** 用户切换类型 tab
- **THEN** 列表内容更新为对应类型的收藏项

#### Scenario: 空状态
- **WHEN** 用户无收藏
- **THEN** 显示空状态提示
