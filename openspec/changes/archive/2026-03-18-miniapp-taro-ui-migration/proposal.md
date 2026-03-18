# miniapp Taro UI 全量迁移

## Why

当前 miniapp 使用纯 @tarojs/components 与自研组件，无统一 UI 框架，表单、按钮、筛选等控件样式与交互分散维护，扩展与一致性成本高。引入 Taro UI 可统一组件体系、提升开发效率，并与 Taro 生态对齐。

## What Changes

- **依赖**：新增 taro-ui，在 app.scss 引入样式
- **表单页**：login、register、profile 的 Input/Button/Textarea 替换为 AtInput、AtButton、AtTextarea
- **审核状态页**：自定义进度条替换为 AtSteps，按钮替换为 AtButton
- **首页与筛选**：FilterBar 的搜索与分段器替换为 AtSearchBar、AtSegmentedControl；FilterSheet 视适配成本决定是否用 AtFloatLayout
- **导航与卡片**：BottomNav 评估 AtTabBar 替换；TopBar、BidCard、InfoCard 视 Taro UI 适配度决定保留或替换
- **主题**：覆盖 Taro UI 变量以保持政务蓝 #1677FF
- **清理**：移除冗余 btn-primary、btn-secondary 等自定义按钮样式

## Capabilities

### New Capabilities

- `miniapp-taro-ui-layer`: 小程序 UI 层基于 Taro UI 组件库，表单控件、按钮、步骤条、搜索框、分段器等使用 At* 组件，主题与现有 variables.scss 一致

### Modified Capabilities

- 无。现有 miniapp-login-ui、miniapp-audit-status-page、miniapp-home-filter-modes 等 spec 描述的是功能需求，本次仅改变实现方式，不改变需求与接口契约

## Impact

- **代码**：miniapp/src 下各页面与组件
- **依赖**：package.json 新增 taro-ui
- **样式**：app.scss、styles/base.scss、各页面 scss
- **其他模块**：server、admin-frontend、crawler 不受影响
