# 管理接口本地交互指南

## 当前状态

- 后端服务地址：`http://localhost:8000`
- 当前仓库已不再包含正式的 Web 管理后台前端
- 管理相关能力目前以服务端接口形式保留

## 适用范围

本文档用于本地验证以下管理能力：

- 企业认证申请列表与详情
- 企业认证审核通过 / 驳回
- 企业目录查询
- 采集控制面动作查询、提交与运行记录查询

## 管理员认证

所有管理员接口均需要携带：

```http
Authorization: Bearer admin-secret-token-change-in-production
```

说明：

- 这是开发环境默认 token
- 生产环境必须替换为安全值

## 常用接口

### 1. 企业认证审核

查看申请列表：

```bash
curl -X GET "http://localhost:8000/api/admin/reviews?status=pending" \
  -H "Authorization: Bearer admin-secret-token-change-in-production"
```

查看申请详情：

```bash
curl -X GET "http://localhost:8000/api/admin/reviews/<application_id>" \
  -H "Authorization: Bearer admin-secret-token-change-in-production"
```

审核通过：

```bash
curl -X POST "http://localhost:8000/api/admin/reviews/<application_id>/approve" \
  -H "Authorization: Bearer admin-secret-token-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{}'
```

审核驳回：

```bash
curl -X POST "http://localhost:8000/api/admin/reviews/<application_id>/reject" \
  -H "Authorization: Bearer admin-secret-token-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"rejectReason":"请补充完整的企业信息"}'
```

### 2. 企业目录

```bash
curl -X GET "http://localhost:8000/api/admin/companies?page=1&pageSize=20" \
  -H "Authorization: Bearer admin-secret-token-change-in-production"
```

### 3. 采集控制面

查看可用动作：

```bash
curl -X GET "http://localhost:8000/api/admin/crawl/actions" \
  -H "Authorization: Bearer admin-secret-token-change-in-production"
```

查看运行记录：

```bash
curl -X GET "http://localhost:8000/api/admin/crawl/runs?limit=20" \
  -H "Authorization: Bearer admin-secret-token-change-in-production"
```

提交控制面请求：

```bash
curl -X POST "http://localhost:8000/api/admin/crawl/runs" \
  -H "Authorization: Bearer admin-secret-token-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "actionKey":"site2.precheck",
    "params":{}
  }'
```

## 测试数据流程

### 1. 创建测试用户并提交认证

获取验证码：

```bash
curl -X GET "http://localhost:8000/api/auth/captcha?mobile=13700137000"
```

登录：

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"mobile":"13700137000","captcha":"123456"}'
```

提交企业认证：

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Authorization: Bearer <用户token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName":"新测试企业",
    "creditCode":"91510100MA62XXXXX3",
    "contactName":"王五",
    "licenseImage":"data:image/png;base64,test123"
  }'
```

### 2. 查看用户审核结果

```bash
curl -X GET "http://localhost:8000/api/auth/audit-status" \
  -H "Authorization: Bearer <用户token>"
```

## 数据库检查

查看申请列表：

```bash
sqlite3 data/notices.db "SELECT id, company_name, status, created_at, audit_at FROM enterprise_applications ORDER BY created_at DESC"
```

查看指定用户申请：

```bash
sqlite3 data/notices.db "SELECT * FROM enterprise_applications WHERE user_id='<user_id>'"
```

## 故障排查

### 管理接口返回 403

- 确认请求头格式为 `Bearer <token>`
- 确认使用的是当前环境的管理员 token

### 控制面请求被拒绝

- 检查 action 是否在白名单内
- 检查 backfill / reconcile 参数是否超出允许范围
- 检查目标站点是否已有 `queued` 或 `running` 的控制面任务

### 采集任务失败

常见原因：

1. 代理配置问题
   - 检查 `crawler/site2/config.py` 中的代理认证信息
   - 查看日志是否有 `ProxyError` 或 `Failed to extract proxy` 错误
   - 确认代理账号余额充足且未过期

2. 验证码识别失败
   - 查看日志中的验证码识别错误
   - 验证码服务可能暂时不可用

3. 网络连接问题
   - 确认服务器可以访问目标站点
   - 检查代理服务商 API 是否可用

查看采集日志：

```bash
# 查看最近的采集任务日志
ls -lt logs/admin-crawl/
tail -f logs/admin-crawl/run_<run_id>.log
```

### 当前没有 Web 页面可访问

这是预期行为。`ui` 样例工程已经退役，当前仓库保留的是服务端管理接口，而不是正式 Web 管理后台前端。
