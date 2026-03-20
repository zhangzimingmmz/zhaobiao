# Tasks: admin-frontend-ant-design-refactor

## 1. 登录页 (LoginPage)

- [x] 1.1 将 LoginPage 改为 antd Form + Input + Button，移除原生 input/button
- [x] 1.2 使用 Form 的 onFinish 与 validateFields 管理提交逻辑

## 2. 内容管理 (ArticlesPage)

- [x] 2.1 将 ArticlesPage 改为 ProTable，定义 columns（标题、分类、状态、发布时间、浏览量、操作）
- [x] 2.2 配置 ProTable request 调用 getAdminArticles，支持 status/category/keyword 筛选与分页
- [x] 2.3 操作列使用 Button，发布/下线/删除用 Modal.confirm 与 message 替代 confirm/alert

## 3. 采集控制 (CrawlPage)

- [x] 3.1 将 CrawlPage 改为 antd Form + Select + Input，动作选择用 Select，参数用 Form.Item + Input
- [x] 3.2 提交用 form.validateFields 与 form.getFieldsValue，按钮用 Button
- [x] 3.3 成功/失败反馈用 message 替代 alert

## 4. 运行记录 (RunsPage)

- [x] 4.1 将 RunsPage 改为 ProTable，定义 columns（动作、站点、状态、请求时间、操作）
- [x] 4.2 配置 request 调用 /api/admin/crawl/runs，支持 status/site 筛选与分页
- [x] 4.3 操作列使用 Button link 样式跳转详情

## 5. 运行详情 (RunDetailPage)

- [x] 5.1 将 RunDetailPage 改为 Card + Descriptions 展示动作、状态、站点、请求时间、摘要、失败原因
- [x] 5.2 请求参数与结果信息用 Card + Typography.Paragraph 或 pre 展示

## 6. 审核详情 (ReviewDetailPage)

- [x] 6.1 将审核详情中的 button、textarea 改为 antd Button、Input.TextArea
- [x] 6.2 通过/驳回确认用 Modal.confirm 替代 confirm，成功反馈用 message（已有）

## 7. 总览 (DashboardPage)

- [x] 7.1 将 DashboardPage 的统计区与入口改为 Card + Button
- [x] 7.2 最近运行列表改为 antd Table 或 ProTable，操作列用 Button link

## 8. 反馈与样式

- [x] 8.1 全站检查并替换残留的 alert/confirm 为 message/Modal.confirm
- [x] 8.2 移除 styles.css 中仅被已重构页面使用的自定义类（primary-button、secondary-button、table-card、runs-table、link-button 等），确认无其他引用后再删
