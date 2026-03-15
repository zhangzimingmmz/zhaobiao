## ADDED Requirements

### Requirement: 5 种 FilterBar 业务态
FilterBar SHALL 根据一级/二级菜单组合渲染 5 种不同布局：engineering-engineering、engineering-procurement、procurement-intention、procurement-announcement、information。

#### Scenario: 工程建设-工程建设
- **WHEN** 一级为工程建设、二级为工程建设
- **THEN** 显示「招标计划」「招标公告」按钮行、搜索框、发布时间与交易来源筛选按钮

#### Scenario: 工程建设-政府采购
- **WHEN** 一级为工程建设、二级为政府采购
- **THEN** 显示搜索框、发布时间与交易来源筛选按钮

#### Scenario: 政府采购-采购意向公开
- **WHEN** 一级为政府采购、二级为采购意向公开
- **THEN** 显示搜索框、发布时间与区划筛选按钮

#### Scenario: 政府采购-采购公告
- **WHEN** 一级为政府采购、二级为采购公告
- **THEN** 显示搜索框、采购性质、采购方式、发布时间、区划筛选按钮

#### Scenario: 信息展示
- **WHEN** 一级为信息展示
- **THEN** 仅显示搜索框

### Requirement: 搜索框与筛选按钮带图标
搜索框 SHALL 有占位符和搜索图标；筛选按钮 SHALL 带对应图标（如日历、地图）。

#### Scenario: 搜索框占位符
- **WHEN** 当前为工程建设-工程建设
- **THEN** 占位符为「搜索标题关键词」

#### Scenario: 采购公告搜索占位符
- **WHEN** 当前为政府采购-采购公告
- **THEN** 占位符为「搜索标题 / 项目编号 / 采购人 / 代理机构」
