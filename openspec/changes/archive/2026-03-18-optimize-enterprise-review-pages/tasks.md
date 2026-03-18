## 1. 菜单重命名

- [x] 1.1 修改 admin-frontend/src/components/Layout.tsx 中的菜单项名称
- [x] 1.2 将 "企业审核" 改为 "审核队列"
- [x] 1.3 将 "企业目录" 改为 "企业管理"
- [x] 1.4 验证菜单显示正确

## 2. CompaniesPage 添加状态筛选器

- [x] 2.1 修改 admin-frontend/src/pages/CompaniesPage.tsx
- [x] 2.2 在 status 列添加 valueType: "select" 配置
- [x] 2.3 添加 valueEnum 定义（pending/approved/rejected）
- [x] 2.4 配置 search 属性启用搜索表单
- [x] 2.5 设置 form.initialValues 为 { status: undefined }（默认显示全部）
- [x] 2.6 修改 request 函数，根据 params.status 动态构建 API URL
- [x] 2.7 处理 status 为 undefined 时不传递该参数

## 3. 筛选器功能测试

- [x] 3.1 测试默认显示全部企业（无 status 参数）
- [x] 3.2 测试筛选"待审核"状态
- [x] 3.3 测试筛选"已通过"状态
- [x] 3.4 测试筛选"已驳回"状态
- [x] 3.5 测试切换筛选条件时分页重置到第一页
- [x] 3.6 验证筛选器与分页联动正常

## 4. 抽取共用组件（可选优化）

- [x] 4.1 创建 admin-frontend/src/components/EnterpriseColumns.tsx
- [x] 4.2 抽取企业名称列渲染逻辑
- [x] 4.3 抽取法人信息列渲染逻辑
- [x] 4.4 抽取状态列配置
- [x] 4.5 在 ReviewsPage 中使用共用列定义
- [x] 4.6 在 CompaniesPage 中使用共用列定义
- [x] 4.7 验证两个页面显示一致

## 5. 本地测试

- [x] 5.1 启动本地开发服务器 (npm run dev)
- [x] 5.2 验证菜单名称已更新
- [x] 5.3 测试 CompaniesPage 筛选功能完整性
- [x] 5.4 确认 ReviewsPage 功能不受影响（默认仍为待审核）
- [x] 5.5 测试两个页面的分页功能
- [x] 5.6 检查控制台无错误

## 6. 构建与部署

- [x] 6.1 构建前端代码 (npm run build)
- [x] 6.2 检查构建输出无错误
- [x] 6.3 重启运营后台容器 (docker-compose restart admin-frontend) - 需在生产服务器执行
- [x] 6.4 访问生产环境验证部署成功

## 7. 生产环境验证

- [x] 7.1 访问 https://admin-zhaobiao.zhangziming.cn
- [x] 7.2 验证菜单名称显示为"审核队列"和"企业管理"
- [x] 7.3 测试企业管理页面筛选器功能
- [x] 7.4 验证审核队列页面功能正常
- [x] 7.5 测试完整的审核工作流（查看、审核、筛选）
