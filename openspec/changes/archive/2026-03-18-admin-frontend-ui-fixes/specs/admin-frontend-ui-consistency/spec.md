# Spec: admin-frontend-ui-consistency

## ADDED Requirements

### Requirement: 运营后台 SHALL 使用统一设计系统
所有页面 SHALL 使用同一套 CSS 类名体系（`.primary-button`、`.secondary-button`、`.card`、`.table-card`、`.stack`、`.toolbar` 等），不得使用未在 `styles.css` 中定义的类名。

#### Scenario: Articles 页面按钮样式
- **WHEN** 用户访问内容管理或文章编辑页面
- **THEN** 按钮、表格、徽章等组件与主流程页面（企业审核、运行记录等）视觉一致

#### Scenario: 新增页面遵循设计系统
- **WHEN** 新增运营后台页面
- **THEN** 该页面使用既有类名，不引入未定义样式

### Requirement: 状态组件 SHALL 使用统一接口
LoadingState、EmptyState、ErrorState 的 props 接口 SHALL 在各调用处一致使用。ErrorState 的 prop 名 SHALL 为 `error`。

#### Scenario: 错误信息正确展示
- **WHEN** ArticlesPage 或 ArticleEditorPage 发生加载或提交错误
- **THEN** 错误信息正确显示在页面上

### Requirement: Toolbar 内筛选控件 SHALL 并排展示
在 `.toolbar` 内的 `select`、`input` 等筛选控件 SHALL 在宽屏下并排显示，不因 `width: 100%` 导致纵向堆叠。

#### Scenario: 运行记录筛选器布局
- **WHEN** 用户访问运行记录页面
- **THEN** 「全部状态」「全部站点」两个下拉框并排显示

#### Scenario: 企业审核筛选器布局
- **WHEN** 用户访问企业审核页面
- **THEN** 状态筛选下拉框与页面内容合理排布，不占满整行

### Requirement: 表格单元格内多行内容 SHALL 保持垂直对齐
表格单元格内包含主内容与辅助信息（如企业名 + 登录名）时，SHALL 使用内联或行内块结构，避免块级元素导致行高不一致、垂直对齐错乱。

#### Scenario: 企业审核列表行高
- **WHEN** 用户查看企业审核或企业目录列表
- **THEN** 同一行各列内容垂直居中对齐，行高一致

### Requirement: 卡片与表格层级 SHALL 清晰
当表格作为卡片内容时，SHALL 避免「卡片套卡片」的嵌套，表格区域使用轻量容器或直接置于卡片内，不重复应用完整卡片样式。

#### Scenario: 今日定时任务概览
- **WHEN** 用户查看总览页的今日定时任务概览
- **THEN** 表格与标题、按钮处于同一卡片内，无多余嵌套边框与背景

### Requirement: 加载与空状态 SHALL 使用轻量视觉
LoadingState、EmptyState SHALL 使用轻量样式（如小卡片或行内提示），不占用过大视觉空间。

#### Scenario: 加载中展示
- **WHEN** 页面处于加载状态
- **THEN** 显示「加载中...」等提示，不出现大块空白卡片

#### Scenario: 空数据展示
- **WHEN** 列表或区域无数据
- **THEN** 显示「暂无数据」等提示，视觉重量适中
