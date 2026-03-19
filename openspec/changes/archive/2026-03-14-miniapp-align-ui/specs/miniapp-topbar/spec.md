## ADDED Requirements

### Requirement: TopBar 白底顶栏样式
TopBar 组件 SHALL 使用白色背景、底部灰色边框，标题单行显示，与 ui 参考一致。

#### Scenario: 首页 TopBar 展示
- **WHEN** 用户进入首页
- **THEN** 顶栏为白底、标题为「金堂招讯通」、右侧有收藏图标和个人中心图标

#### Scenario: 详情页 TopBar
- **WHEN** 用户进入详情页
- **THEN** 顶栏显示返回按钮、标题、收藏图标（可切换已收藏/未收藏状态）

### Requirement: TopBar 右侧图标
TopBar 右侧 SHALL 展示收藏图标（心形）和个人中心图标（人形），点击分别跳转收藏列表和我的页面。

#### Scenario: 点击收藏图标
- **WHEN** 用户点击收藏图标
- **THEN** 跳转至收藏列表页

#### Scenario: 点击个人中心图标
- **WHEN** 用户点击个人中心图标
- **THEN** 跳转至我的页面（tabBar）
