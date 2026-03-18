## 1. 依赖与基础配置

- [x] 1.1 安装 antd、@ant-design/pro-components、dayjs
- [x] 1.2 在 main.tsx 或 App 根节点包裹 ConfigProvider（含中文 locale）
- [x] 1.3 引入 antd 样式（如 `import 'antd/dist/reset.css'` 或按 Ant Design v5 文档方式）

## 2. 布局壳层

- [x] 2.1 使用 ProLayout 替换 Layout.tsx，配置 route.routes 对应总览、企业审核、企业目录、采集控制、运行记录、内容管理
- [x] 2.2 将 location.pathname 与 onMenuClick 与现有 navigate 逻辑对接，实现菜单点击跳转与高亮
- [x] 2.3 在 ProLayout 的 content 区域渲染 App 中的 route.content，保留 page-header 的 title/subtitle 展示

## 3. 登录页

- [x] 3.1 用 Ant Design Form、Input、Button 重写 LoginPage，保持现有 auth 逻辑与 API 调用
- [x] 3.2 登录页居中布局、品牌区域（可选），错误提示用 message 或 Alert 展示

## 4. 总览页

- [x] 4.1 用 Card、Statistic 等组件重写 DashboardPage，展示待审核数量与采集运行概况
- [x] 4.2 待审核数量卡片支持点击跳转至 /reviews
- [x] 4.3 今日定时任务概览或最近运行用 Table 或 List 展示，状态用 Tag/Badge

## 5. 企业审核

- [x] 5.1 用 ProTable 重写 ReviewsPage，request 对接 GET /api/admin/reviews，配置 status 筛选、分页
- [x] 5.2 用 ProDescriptions 或 Descriptions + Image 重写 ReviewDetailPage，展示企业资料与营业执照
- [x] 5.3 审核通过/驳回用 Modal.confirm + Button 实现，调用 approve/reject 接口

## 6. 企业目录

- [x] 6.1 用 ProTable 重写 CompaniesPage，request 对接 GET /api/admin/companies，配置分页

## 7. 采集控制

- [x] 7.1 用 ProForm 或 Form 重写 CrawlPage，展示可发起动作、参数输入与提交
- [x] 7.2 提交逻辑对接 /api/admin/crawl/actions、/api/admin/crawl/runs，成功后提示并可选跳转运行记录

## 8. 运行记录

- [x] 8.1 用 ProTable 重写 RunsPage，request 对接 GET /api/admin/crawl/runs，配置状态筛选、分页
- [x] 8.2 用 ProDescriptions 或 Descriptions 重写 RunDetailPage，展示动作、参数、摘要、失败原因

## 9. 内容管理

- [x] 9.1 用 ProTable 重写 ArticlesPage，对接文章列表接口
- [x] 9.2 用 ProForm 或 Form 重写 ArticleEditorPage，支持新增与编辑，对接创建/更新接口

## 10. 状态反馈与清理

- [x] 10.1 各 ProTable/request 场景确保 loading、空状态、错误态由 Ant Design 组件处理
- [x] 10.2 删除 styles.css 中已被 Ant Design 覆盖的布局、表格、表单样式，保留必要业务样式
- [x] 10.3 移除 States.tsx 中与 Ant Design 重复的组件（如有），或改为封装 Ant Design 的 Empty、Result 等
