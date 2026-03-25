## Why

当前小程序工程建设板块只显示"招标文件预公示"单一内容，但根据最新产品需求（PDF 设计稿），需要恢复为三个可切换的 Tab，以便用户能够分别查看招标计划、招标文件预公示和招标公告三类信息。这样可以提供更完整的工程建设信息浏览体验。

## What Changes

- 小程序工程建设板块从单一"招标文件预公示"改为三个可切换的二级 Tab
- 添加三个 Tab：招标计划（002001009）、招标文件预公示（002001010）、招标公告（002001001）
- 移除当前的固定"招标文件预公示"小节标题
- 根据选中的 Tab 动态切换 category 参数请求不同类型的公告数据
- 更新相关的 UI 组件和状态管理逻辑

## Capabilities

### New Capabilities
- `miniapp-construction-tabs`: 小程序工程建设板块的三个 Tab 切换功能，包括 Tab 配置、状态管理和数据请求逻辑

### Modified Capabilities
- `miniapp-home-filter-modes`: 工程建设板块的筛选模式需要适配三个不同的 Tab，每个 Tab 可能有不同的筛选项配置

## Impact

- 小程序首页代码：`miniapp/src/pages/index/index.tsx`
  - `SECONDARY_MAP.construction` 需要从空数组改为三个 Tab 配置
  - `getCategory()` 函数需要根据 secondary 参数返回不同的 category
  - 移除工程建设板块的固定小节标题渲染逻辑
- 可能影响的组件：
  - `SecondaryTabs` 组件（已存在，无需修改）
  - `FilterBar` 组件（可能需要适配不同 Tab 的筛选项）
- 后端 API 无需修改（已支持三个 category）
- 数据库无需修改（已有三个分类的数据）
