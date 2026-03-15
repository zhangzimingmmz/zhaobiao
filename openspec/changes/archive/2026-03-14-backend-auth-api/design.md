## Context

当前后端 `server/main.py` 已实现核心的公告列表与详情接口（`/api/list`、`/api/detail/bid/:id`、`/api/detail/info/:id`），但认证用户系统完全空白，且列表接口缺少三个筛选参数（`source`、`purchaseManner`、`purchaser`）。SQLite 数据库（`data/notices.db`）目前只有 `notices`、`dict_region`、`dict_purchase_manner`、`dict_notice_category` 四张表，无用户相关表。

项目为单机部署、轻量级小程序后端，无需引入重型认证框架，优先简单可用。

## Goals / Non-Goals

**Goals:**
- 在现有 FastAPI + SQLite 架构上以最小改动补全用户认证系统
- 实现 `/api/auth/captcha`（Mock）、`/api/auth/login`（JWT）、`/api/auth/register`、`/api/auth/audit-status` 四个接口
- 补全 `/api/list` 的 `source`、`purchaseManner`、`purchaser` 参数支持
- 新增 `users`、`enterprise_applications` 两张数据库表

**Non-Goals:**
- 不引入 OAuth / 第三方登录
- 不实现收藏接口（`/api/favorites`，属于独立 change）
- 不做管理后台（审核由数据库直接操作）
- 不做短信验证码发送（初期 Mock 固定验证码）

## Decisions

### 决策 1：JWT 而非 Session

使用 `python-jose` 生成/验证 JWT token，不依赖 session 存储。
- **原因**：小程序天然无 cookie，JWT 更适合无状态移动端；且不需要额外 Redis。
- **备选**：UUID token 存 SQLite — 更简单但每次请求需查库。

### 决策 2：验证码使用 Mock 模式

初期 `GET /api/auth/captcha` 返回固定 base64 图片 + 固定验证码 `123456`，验证码存内存 dict（按手机号键控）。
- **原因**：短信/图形验证码需要第三方服务，当前阶段不必要；Mock 足够前端联调。
- **升级路径**：后续替换为真实图形验证码库（`captcha`）或短信网关，接口契约不变。

### 决策 3：认证中间件使用依赖注入

通过 FastAPI `Depends` 实现 `get_current_user`，需要鉴权的路由注入此依赖，无需全局中间件。
- **原因**：只有 `/api/auth/audit-status`（以及后续收藏）需要鉴权，其余接口公开；按需注入更清晰。

### 决策 4：新增表通过启动时 DDL 自动建表

在 `server/main.py` 的 `lifespan` 或启动事件中执行建表 SQL（`CREATE TABLE IF NOT EXISTS`），无需额外迁移工具。
- **原因**：项目规模小，SQLite 的 DDL 幂等执行足够；避免引入 Alembic 等迁移框架增加复杂度。

### 决策 5：`source` 筛选映射规则

`source` 参数值映射到 notices 表的 `tradingsourcevalue` 字段（site1）或后续 site2 的来源字段。初期只筛选 site1 数据，若 source 值不匹配则返回空列表（明确文档化行为）。

## Risks / Trade-offs

- [风险] Mock 验证码硬编码 `123456`，生产环境需替换 → **缓解**：在代码中加显眼注释 `# TODO: replace with real captcha`，并在文档中标注
- [风险] JWT secret 硬编码在代码里 → **缓解**：从环境变量 `JWT_SECRET`读取，提供默认 dev 值
- [风险] 审核状态只能由数据库手动改 → **缓解**：在 README 中说明管理员操作方法；后续可加管理接口
- [Trade-off] 不做真实短信验证码，登录流程安全性低 → 与当前项目阶段匹配，用户量小、内部使用

## Migration Plan

1. 执行新建表 DDL（`CREATE TABLE IF NOT EXISTS`，不影响现有数据）
2. 重启 `uvicorn` 使路由生效
3. 无 rollback 风险（纯新增，不修改现有表结构）

## Open Questions

- 审核通过后是否需要通知（短信/推送）？→ 暂定：不通知，用户主动查询
- `source` 的可选值由前端硬编码还是通过字典接口获取？→ 暂定：前端硬编码，字典接口可选后续添加
