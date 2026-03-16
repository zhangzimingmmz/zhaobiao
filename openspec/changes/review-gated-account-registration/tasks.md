## 1. 数据库与数据模型

- [x] 1.1 为 `users` 表添加幂等的模式迁移，以包含 `username`、`password_hash`、`account_status` 和 `updated_at` 字段
- [x] 1.2 扩展 `enterprise_applications` 表，增加 `legal_person_name`、`legal_person_phone`、`business_scope` 和 `business_address` 字段
- [x] 1.3 在 SQLite 查询中确保 `username` 和最新的 `applicationId` 的唯一性和查询路径得到强制执行

## 2. 用户认证 API

- [x] 2.1 重写 `POST /api/auth/register` 为匿名注册，创建待审核的账户和申请记录
- [x] 2.2 重写 `POST /api/auth/login` 以使用 `username` 和 `password`，仅对 `approved`（已批准）账户返回令牌
- [x] 2.3 重新定义 `GET /api/auth/audit-status`，改为通过注册标识符而非 Bearer 令牌进行查询
- [x] 2.4 更新 JWT 载荷创建和认证辅助函数，以匹配新的账户模型

## 3. 管理员审核流程

- [x] 3.1 扩展管理员审核列表/详情响应，以暴露新的企业注册字段
- [x] 3.2 更新管理员批准/拒绝处理程序，使 `users.account_status` 与审核结果同步
- [x] 3.3 验证非管理员请求仍被阻止访问 `/api/admin/*` 审核端点

## 4. 小程序认证与路由

- [x] 4.1 将小程序登录表单字段和服务调用从手机验证码方式替换为用户名-密码方式
- [x] 4.2 扩展小程序注册表单，以捕获所有必需的账户和企业审核字段
- [x] 4.3 更新登录结果路由：待审核账户跳转至审核状态页，被拒账户跳转至重新提交页，仅已批准账户进入主页
- [x] 4.4 更新审核状态和个人资料流程，对于待审核或被拒账户，使用注册标识符而非登录令牌

## 5. 验证

- [x] 5.1 验证注册会创建一个待审核账户并返回一个 `applicationId`
- [x] 5.2 验证待审核和被拒账户无法获取登录令牌，并收到正确的状态响应
- [x] 5.3 验证已批准账户可以成功登录，并且管理员审核操作能正确转换账户状态