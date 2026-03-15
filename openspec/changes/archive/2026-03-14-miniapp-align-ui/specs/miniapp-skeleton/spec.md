## ADDED Requirements

### Requirement: 列表骨架屏
首页列表加载时 SHALL 显示 BidCardSkeleton 占位卡片，而非纯文字「加载中...」。

#### Scenario: 加载中展示
- **WHEN** 用户进入首页且列表正在加载
- **THEN** 显示 3～5 个骨架卡片占位

#### Scenario: 加载完成
- **WHEN** 列表数据加载完成
- **THEN** 骨架屏消失，显示实际 BidCard 或 InfoCard
