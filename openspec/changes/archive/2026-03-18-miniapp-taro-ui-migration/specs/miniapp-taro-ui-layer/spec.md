# miniapp-taro-ui-layer 能力规范

小程序 UI 层基于 Taro UI 组件库，表单控件、按钮、步骤条、搜索框、分段器等使用 At* 组件，主题与现有 variables.scss 一致。

## ADDED Requirements

### Requirement: 表单控件使用 Taro UI

系统 SHALL 在登录、注册、个人中心等表单页使用 AtInput、AtButton、AtTextarea 等 Taro UI 组件，替代原生 Input、Button。

#### Scenario: 登录页表单

- **WHEN** 用户进入登录页
- **THEN** 登录名与密码输入框、登录按钮使用 AtInput、AtButton 渲染，样式与主题一致

#### Scenario: 注册页表单

- **WHEN** 用户进入注册页
- **THEN** 各输入项与提交按钮使用 AtInput、AtButton、AtTextarea 渲染

### Requirement: 审核状态页使用 Taro UI 步骤条

系统 SHALL 在审核状态页使用 AtSteps 展示进度（提交资料、审核中、开通），使用 AtButton 作为主操作按钮。

#### Scenario: 审核中状态展示

- **WHEN** 用户进入审核状态页且状态为 pending
- **THEN** 系统使用 AtSteps 展示三步骤，当前步骤为「审核中」，主按钮使用 AtButton

### Requirement: 筛选区使用 Taro UI 组件

系统 SHALL 在首页筛选区使用 AtSearchBar 或 AtSegmentedControl 等 Taro UI 组件，替代自研搜索框与分段器（若 POC 验证可行）。

#### Scenario: 搜索与分段

- **WHEN** 用户进入首页
- **THEN** 搜索框与招标计划/公告切换使用 Taro UI 组件（或保留自研，依设计决策）

### Requirement: 主题与现有设计 token 一致

系统 SHALL 通过 SCSS 变量覆盖或追加样式，使 Taro UI 组件的主色、圆角等与 variables.scss 中的 $color-primary（#1677FF）一致。

#### Scenario: 主色一致

- **WHEN** 用户查看任意使用 Taro UI 的页面
- **THEN** 主按钮、链接、高亮等使用政务蓝 #1677FF
