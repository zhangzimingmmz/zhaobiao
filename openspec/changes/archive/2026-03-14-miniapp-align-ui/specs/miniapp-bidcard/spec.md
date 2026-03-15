## ADDED Requirements

### Requirement: BidCard 完整字段展示
BidCard 组件 SHALL 展示标题、采购性质标签（蓝）、采购方式标签（绿）、预算金额（橙）、招标人、区划、截止时间、发布时间，带对应图标。

#### Scenario: 有预算时显示
- **WHEN** 列表项包含 budget 字段
- **THEN** 显示橙色预算金额（如「110.00万元」）及钱袋图标

#### Scenario: 有招标人时显示
- **WHEN** 列表项包含 purchaser 字段
- **THEN** 显示招标人及建筑图标

#### Scenario: 有区划时显示
- **WHEN** 列表项包含 regionName 字段
- **THEN** 显示区划及地图图标

#### Scenario: 截止时间显示
- **WHEN** 列表项包含 expireTime 或 openTenderTime
- **THEN** 显示「截止：YYYY-MM-DD」及日历图标

### Requirement: BidCard 圆角卡片样式
BidCard SHALL 使用圆角、边框、hover 态（小程序为点击态），与 ui 参考一致。

#### Scenario: 卡片视觉
- **WHEN** 用户浏览列表
- **THEN** 每张卡片为白底、圆角、灰色边框
