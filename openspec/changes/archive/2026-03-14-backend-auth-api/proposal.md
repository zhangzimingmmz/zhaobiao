## Why

当前后端（`server/main.py`）已实现列表与详情核心接口，但对照《接口文档-前端与小程序》，以下接口完全缺失：认证用户系统（验证码 / 登录 / 企业注册 / 审核状态），以及列表接口缺少 `source`、`purchaseManner`、`purchaser` 三个筛选参数。前端登录页、注册页、审核状态页、「我的」页均依赖这些接口，需要补全才能打通用户流程。

## What Changes

- **补全列表接口筛选参数**：`/api/list` 增加 `source`、`purchaseManner`、`purchaser` 三个可选 query 参数，并在 SQL 查询中生效。
- **新增验证码接口**：`GET /api/auth/captcha`，返回图片 base64；初期可使用 Mock（固定验证码），支持前端联调。
- **新增登录接口**：`POST /api/auth/login`，手机号 + 验证码，成功返回 JWT token。
- **新增企业注册接口**：`POST /api/auth/register`，提交企业信息，写入用户/认证表，状态 pending。
- **新增审核状态查询接口**：`GET /api/auth/audit-status`，需 Bearer token 鉴权，返回当前用户审核状态。
- **新增数据库表**：`users`（手机号/token 等）、`enterprise_applications`（企业认证申请及审核状态）。

## Capabilities

### New Capabilities

- `list-filters-enhancement`：列表接口补充 source / purchaseManner / purchaser 筛选参数支持
- `auth-captcha`：获取验证码（Mock 模式）
- `auth-login`：手机号 + 验证码登录，返回 JWT
- `auth-register`：企业注册申请（提交企业信息）
- `auth-audit-status`：审核状态查询（鉴权接口）

### Modified Capabilities

- `notices-api`：`/api/list` 增加三个筛选参数（需求层级变化，不破坏现有调用）

## Impact

- `server/main.py`：主要修改文件，新增路由与 SQL 逻辑
- `server/` 目录：需新增 `auth.py`（JWT 工具）、`db_init.py`（新建表 DDL）
- SQLite `data/notices.db`：新增 `users` 表与 `enterprise_applications` 表
- 前端：登录/注册/审核状态页解除阻塞，可接入真实接口
