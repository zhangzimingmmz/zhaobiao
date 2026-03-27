## 1. 管理员账号存储

- [x] 1.1 设计并落地后台管理员账号表，支持 reviewer 的持久化存储与状态字段
- [x] 1.2 保留 `super_admin` 的环境变量启动入口，并为旧 `ADMIN_REVIEWER1_*` / `ADMIN_REVIEWER2_*` 提供受控导入或兼容策略

## 2. 后端鉴权与 reviewer 管理接口

- [x] 2.1 调整后台登录与身份解析逻辑，使 reviewer 从数据库读取，禁用 reviewer 无法登录
- [x] 2.2 实现 reviewer 列表、创建、重置密码、启用/禁用接口，并限制为 `super_admin` 可调用
- [x] 2.3 调整审核人显示名解析逻辑，使受管 reviewer 的审核留痕能正确映射显示

## 3. 后台页面与导航

- [x] 3.1 在“运营设置”下新增 reviewer 管理入口，并按角色控制可见性
- [x] 3.2 实现 reviewer 管理页面，支持列表查看、创建 reviewer、重置密码、启用/禁用
- [x] 3.3 为 reviewer 角色验证隐藏入口和受保护路由，避免通过前端路径直接访问

## 4. 迁移与兼容

- [x] 4.1 补充 reviewer 账号模型与初始化/迁移说明，确保新老部署路径清晰可执行
- [x] 4.2 更新后台管理接口文档和运维文档，说明 reviewer 账号不再通过 `.env.backend` 日常维护

## 5. 验证

- [x] 5.1 验证 `super_admin` 可以创建 reviewer、重置密码、启用/禁用 reviewer
- [x] 5.2 验证禁用 reviewer 后无法登录，但历史审核记录仍能显示其身份
- [x] 5.3 验证 reviewer 无法访问 reviewer 管理页面或调用对应接口
