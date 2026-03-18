# admin-frontend-ui 能力规范

运营后台前端 UI 体系，基于 Ant Design Pro 实现，包含布局壳层、导航、登录、总览、企业审核、企业目录、采集控制、运行记录、内容管理各页面的展示与交互。

## ADDED Requirements

### Requirement: 后台布局壳层

系统 SHALL 提供统一的运营后台布局，包含侧边栏导航区与主内容区。侧边栏 SHALL 展示品牌标识与一级菜单；主内容区 SHALL 展示当前页面标题、副标题与页面内容。未登录用户 SHALL 无法访问布局内的任何页面。

#### Scenario: 已登录用户访问后台

- **WHEN** 用户已通过登录页认证并进入后台
- **THEN** 系统展示侧边栏与主内容区，侧边栏高亮当前路由对应的菜单项

#### Scenario: 未登录用户访问后台路由

- **WHEN** 用户未登录且访问任意后台路由（如 /dashboard、/reviews）
- **THEN** 系统重定向至登录页

### Requirement: 后台导航

系统 SHALL 提供一级导航菜单，支持跳转至：总览、企业审核、企业目录、采集控制、运行记录、内容管理。当前路由对应的菜单项 SHALL 高亮显示。

#### Scenario: 用户点击导航项

- **WHEN** 用户点击侧边栏中的某个导航项
- **THEN** 系统跳转至对应页面，且该导航项呈高亮状态

### Requirement: 后台登录

系统 SHALL 提供登录页，支持输入账号与密码。登录成功后 SHALL 将 token 持久化至本地存储，并跳转至总览页。登录失败 SHALL 展示明确错误提示。

#### Scenario: 登录成功

- **WHEN** 用户输入正确账号密码并提交
- **THEN** 系统保存 token、跳转至总览页

#### Scenario: 登录失败

- **WHEN** 用户输入错误账号密码并提交
- **THEN** 系统展示错误提示，不跳转

### Requirement: 总览页

系统 SHALL 在总览页展示待审核企业数量、今日定时任务概览或最近采集运行概况。待审核数量 SHALL 支持点击进入企业审核列表。

#### Scenario: 总览页加载

- **WHEN** 用户进入总览页
- **THEN** 系统展示待审核数量卡片及采集运行概况，数据来自 `/api/admin/reviews`、`/api/admin/crawl/runs` 等接口

### Requirement: 企业审核列表

系统 SHALL 提供企业审核列表页，展示企业认证申请列表，支持按状态筛选与分页。列表 SHALL 展示企业名称、联系人、状态、申请时间等关键字段，并支持点击进入审核详情。

#### Scenario: 列表加载与筛选

- **WHEN** 用户进入企业审核列表或切换筛选条件
- **THEN** 系统请求 `/api/admin/reviews` 并展示分页列表，支持 status、page、pageSize 参数

### Requirement: 企业审核详情

系统 SHALL 提供审核详情页，展示企业资料与营业执照图片。系统 SHALL 支持审核通过与驳回操作，操作成功后更新列表状态。

#### Scenario: 审核通过

- **WHEN** 运营人员在详情页点击通过并确认
- **THEN** 系统调用 `/api/admin/reviews/{id}/approve`，成功后可返回列表或刷新详情

#### Scenario: 审核驳回

- **WHEN** 运营人员在详情页点击驳回并确认
- **THEN** 系统调用 `/api/admin/reviews/{id}/reject`，成功后可返回列表或刷新详情

### Requirement: 企业目录

系统 SHALL 提供企业目录页，展示企业清单与认证状态，支持分页与简单搜索（如有接口支持）。

#### Scenario: 企业目录加载

- **WHEN** 用户进入企业目录页
- **THEN** 系统请求 `/api/admin/companies` 并展示企业列表

### Requirement: 采集控制

系统 SHALL 提供采集控制页，展示可发起的采集动作，支持填写必要参数并提交运行请求。

#### Scenario: 发起采集运行

- **WHEN** 用户选择采集动作、填写参数并提交
- **THEN** 系统调用 `/api/admin/crawl/runs` 或等价接口发起运行，并展示提交结果

### Requirement: 运行记录列表

系统 SHALL 提供运行记录列表页，展示历史运行记录，支持按状态、时间等筛选与分页。列表 SHALL 展示动作、状态、运行时间等字段，并支持点击进入运行详情。

#### Scenario: 运行记录加载

- **WHEN** 用户进入运行记录页
- **THEN** 系统请求 `/api/admin/crawl/runs` 并展示分页列表

### Requirement: 运行详情

系统 SHALL 提供运行详情页，展示动作、参数、执行摘要与失败原因（如有）。

#### Scenario: 运行详情加载

- **WHEN** 用户从运行记录列表进入某条运行详情
- **THEN** 系统请求 `/api/admin/crawl/runs/{id}` 并展示详情

### Requirement: 内容管理

系统 SHALL 提供内容管理列表页与文章编辑页。列表页 SHALL 展示文章列表并支持新增、编辑入口；编辑页 SHALL 支持创建与修改公众号文章。

#### Scenario: 文章列表加载

- **WHEN** 用户进入内容管理页
- **THEN** 系统请求文章列表接口并展示

#### Scenario: 文章编辑与保存

- **WHEN** 用户在编辑页填写或修改文章信息并保存
- **THEN** 系统调用创建或更新接口，成功后返回列表或展示成功提示

### Requirement: 基础状态反馈

系统 SHALL 在数据加载中、空数据、接口异常等场景下提供明确的视觉反馈（加载中、空状态、错误提示）。

#### Scenario: 接口加载中

- **WHEN** 页面发起数据请求且未返回
- **THEN** 系统展示加载状态（如 Spin 或 Skeleton）

#### Scenario: 接口异常

- **WHEN** 接口返回错误
- **THEN** 系统展示错误提示，支持重试（如适用）
