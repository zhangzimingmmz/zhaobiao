## Why

当前后台虽然已经支持 `super_admin` 和 `reviewer` 两类身份，但审核员账号仍然依赖服务器 `.env.backend` 手工配置。每次新增、停用、改密都需要改环境变量再重建服务，既不适合日常运营，也让“admin 是否能管理审核员”这个需求始终停留在系统外。

## What Changes

- 新增后台审核员管理能力，允许 `super_admin` 在运营后台查看审核员列表、创建审核员账号、重置密码、启用/禁用账号。
- 将审核员账号来源从固定环境变量扩展为数据库持久化账号，并保留 `super_admin` 的最高权限入口。
- 为后台新增审核员管理页面与受保护接口，只允许 `super_admin` 访问，`reviewer` 不可见也不可调用。
- 让后台登录、审核人展示和历史留痕继续兼容新的审核员账号模型，避免新增账号后审核记录无法正确映射显示名。

## Capabilities

### New Capabilities
- `admin-reviewer-management`: 定义超级管理员在后台创建、维护、启停审核员账号的能力边界、接口契约和页面行为。

### Modified Capabilities
- `admin-frontend-shell`: 后台壳层增加审核员管理入口，并按角色控制其可见性。

## Impact

- 后端：`server/main.py` 管理员鉴权、账号存储与审核人展示逻辑
- 数据库：新增后台管理员账号表或等效持久化结构
- 前端：`admin-frontend` 新增审核员管理页面、路由与菜单入口
- 运维：生产环境不再需要通过 `.env.backend` 维护 reviewer 账号，只保留 `super_admin` 初始入口
