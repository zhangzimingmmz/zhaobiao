## ADDED Requirements

### Requirement: 6 种 FilterSheet 弹层
FilterSheet SHALL 支持 6 种 type：time、source、region、nature、method、purchaser，每种渲染对应选项内容。

#### Scenario: 发布时间弹层
- **WHEN** 用户点击「发布时间」筛选按钮
- **THEN** 弹出底部面板，包含今天、近三天、近一周、近一月等快捷选项及自定义时间段

#### Scenario: 交易来源弹层
- **WHEN** 用户点击「交易来源」筛选按钮
- **THEN** 弹出面板，包含全部及四川 21 地市州选项

#### Scenario: 区划弹层
- **WHEN** 用户点击「区划」筛选按钮
- **THEN** 弹出面板，包含四川 21 地市州选项

#### Scenario: 项目分类弹层
- **WHEN** 用户点击「项目分类」筛选按钮
- **THEN** 弹出面板，包含货物、工程、服务选项

#### Scenario: 采购方式弹层
- **WHEN** 用户点击「采购方式」筛选按钮
- **THEN** 弹出面板，包含公开招标、邀请招标、竞争性谈判等选项

#### Scenario: 采购人弹层
- **WHEN** 用户点击「采购人」筛选按钮
- **THEN** 弹出面板，包含输入框供用户搜索采购人
