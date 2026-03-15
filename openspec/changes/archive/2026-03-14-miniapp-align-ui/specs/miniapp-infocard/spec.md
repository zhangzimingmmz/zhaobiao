## ADDED Requirements

### Requirement: InfoCard 支持封面图
InfoCard 组件 SHALL 支持可选封面图展示，当 item.cover 存在时在右侧显示缩略图。

#### Scenario: 有封面时显示
- **WHEN** 列表项包含 cover 字段
- **THEN** 在卡片右侧显示约 80x80 的圆角封面图

#### Scenario: 无封面时
- **WHEN** 列表项无 cover 字段
- **THEN** 仅显示标题、摘要、发布时间
