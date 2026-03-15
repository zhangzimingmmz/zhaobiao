## 1. 基础准备：数据库表与依赖

- [x] 1.1 安装依赖：`pip3 install python-jose[cryptography] passlib`，并更新 `server/requirements.txt`（若存在）
- [x] 1.2 在 `server/main.py` 的启动逻辑中添加 `users` 表建表 DDL（`CREATE TABLE IF NOT EXISTS users(id, mobile, created_at)`）
- [x] 1.3 在启动逻辑中添加 `enterprise_applications` 表建表 DDL（包含 id/user_id/company_name/credit_code/contact_name/contact_phone/license_image/status/reject_reason/created_at/audit_at）
- [x] 1.4 验证服务启动后两张表均已创建（`sqlite3 data/notices.db ".tables"`）

## 2. JWT 工具模块

- [x] 2.1 新建 `server/auth_utils.py`，实现 `create_access_token(payload, expires_days=7)` 函数（使用环境变量 `JWT_SECRET`，默认 dev 值）
- [x] 2.2 在 `server/auth_utils.py` 中实现 `decode_access_token(token)` 函数，返回 payload 或 None
- [x] 2.3 在 `server/main.py` 中实现 FastAPI 依赖 `get_current_user(authorization: Optional[str] = Header(None))`，解析 Bearer token，返回 userId；无效时 raise HTTPException 包装为业务 `{ "code": 401, ... }` 格式

## 3. 验证码接口（Mock）

- [x] 3.1 在内存 dict 中维护 `captcha_store: dict[str, str]`（key=手机号或 uuid key，value=验证码）
- [x] 3.2 实现 `GET /api/auth/captcha` 路由，生成固定验证码 `123456` 存入 `captcha_store`，返回 `{ "code": 200, "data": { "imageBase64": "...", "key": "<key>" } }`
- [x] 3.3 imageBase64 使用一个 1×1 透明 PNG 的 base64 字符串作为占位符，便于前端渲染不报错

## 4. 登录接口

- [x] 4.1 实现 `POST /api/auth/login` 路由，接收 `{ "mobile": str, "captcha": str }` 请求体
- [x] 4.2 实现手机号 11 位格式校验，不符合返回 `{ "code": 400, "message": "手机号格式不正确" }`
- [x] 4.3 校验 captcha 与 `captcha_store` 匹配，不匹配返回 `{ "code": 400, "message": "验证码错误" }`
- [x] 4.4 用户不存在时自动在 `users` 表创建（INSERT OR IGNORE），取得 userId
- [x] 4.5 生成 JWT token，返回 `{ "code": 200, "data": { "token": "...", "userId": "...", "mobile": "..." } }`

## 5. 企业注册接口

- [x] 5.1 实现 `POST /api/auth/register` 路由，接收完整企业注册请求体（Pydantic 模型）
- [x] 5.2 校验 `creditCode` 为 18 位，`contactPhone` 为 11 位；不符合返回 400
- [x] 5.3 将申请数据插入 `enterprise_applications` 表，状态 `pending`，返回 `{ "code": 200, "data": { "applicationId": "<uuid>", "status": "pending" } }`
- [x] 5.4 验证：调用接口后用 `sqlite3` 查询 `enterprise_applications` 表确认记录写入

## 6. 审核状态查询接口

- [x] 6.1 实现 `GET /api/auth/audit-status` 路由，注入 `get_current_user` 依赖
- [x] 6.2 按 userId 查询 `enterprise_applications` 表最新一条记录
- [x] 6.3 无记录时返回 `{ "code": 404, "message": "未找到认证申请记录" }`
- [x] 6.4 有记录时返回 `{ "code": 200, "data": { "status": ..., "companyName": ..., "creditCode": ..., "auditTime": ..., "rejectReason": ... } }`（`rejectReason` 仅在 rejected 时返回非空值）

## 7. 列表接口补充筛选参数

- [x] 7.1 在 `/api/list` 路由中新增 `source: Optional[str] = Query(None)` 参数
- [x] 7.2 在 SQL 查询构建逻辑中加入 `source` 精确匹配条件（映射到 `tradingsourcevalue` 字段）
- [x] 7.3 在 `/api/list` 路由中新增 `purchaseManner: Optional[str] = Query(None)` 参数并加入 SQL 筛选
- [x] 7.4 在 `/api/list` 路由中新增 `purchaser: Optional[str] = Query(None)` 参数，对采购人字段做 LIKE 模糊匹配
- [x] 7.5 验证：分别带 source、purchaseManner、purchaser 参数调用列表接口，确认过滤生效

## 8. 集成验证

- [x] 8.1 重启 uvicorn，确认所有新接口路由注册成功（访问 `/docs` 查看 Swagger UI）
- [x] 8.2 通过 curl 或 Swagger 完整走通一次：获取验证码 → 登录拿 token → 注册企业 → 查询审核状态
- [x] 8.3 验证无 token 访问 `/api/auth/audit-status` 返回 401 业务错误
- [x] 8.4 验证使用错误验证码登录返回 400 业务错误
