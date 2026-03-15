# Spec: miniapp-notice-detail-pages (delta)

## ADDED Requirements

### Requirement: 详情页「查看原文」与「来源」入口 SHALL 位于信息卡片内部

招投标详情页与信息详情页的「查看原文」按钮与「来源：{sourceSiteName}」文案 SHALL 位于顶部信息卡片内部，置于标题与发布时间下方，与元数据（分类、标题、发布时间）同属一区。SHALL 不置于页脚。

#### Scenario: 查看原文位于信息卡片内

- **WHEN** 详情页加载完成且 detail.originUrl 非空
- **THEN** 「查看原文」按钮 SHALL 显示在信息卡片内、发布时间下方

#### Scenario: 来源位于信息卡片内

- **WHEN** 详情页加载完成且 detail.originUrl 为空、detail.sourceSiteName 非空
- **THEN** 「来源：{sourceSiteName}」SHALL 显示在信息卡片内、发布时间下方

#### Scenario: 页脚不包含查看原文或来源

- **WHEN** 用户查看详情页
- **THEN** 页脚区域 SHALL 不包含「查看原文」按钮或「来源」文案
