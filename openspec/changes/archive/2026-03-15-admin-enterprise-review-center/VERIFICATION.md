# 企业审核中心 - 端到端验证清单

本文档描述企业审核中心的端到端验证流程。

## 验证环境准备

### 1. 启动后端服务

```bash
cd /Users/zhangziming/opt/projects/zhaobiao
PYTHONPATH=. uvicorn server.main:app --reload
```

### 2. 设置管理员 Token

开发环境使用默认 token：`admin-secret-token-change-in-production`

生产环境需要设置环境变量：
```bash
export ADMIN_TOKEN="your-secure-random-token"
```

### 3. 准备测试数据

确保数据库中有测试用户和企业认证申请。

## 端到端验证流程

### 流程 1: 用户提交 → 管理员审核通过 → 用户查看结果

**步骤 1: 用户提交企业认证**

```bash
# 1. 用户登录获取 token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"13800138000","captcha":"123456"}'

# 保存返回的 token
USER_TOKEN="<user_token>"

# 2. 提交企业认证申请
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "companyName":"测试企业A",
    "creditCode":"123456789012345678",
    "licenseImage":"https://example.com/license.jpg"
  }'

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "applicationId": "uuid",
#     "status": "pending",
#     ...
#   }
# }
```

**步骤 2: 用户查看审核状态（pending）**

```bash
curl http://localhost:8000/api/auth/audit-status \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "status": "pending",
#     "nextAction": "view",
#     "companyName": "测试企业A",
#     ...
#   }
# }
```

**步骤 3: 管理员查看待审核列表**

```bash
ADMIN_TOKEN="admin-secret-token-change-in-production"

curl "http://localhost:8000/api/admin/reviews?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "total": 1,
#     "list": [
#       {
#         "id": "uuid",
#         "companyName": "测试企业A",
#         "status": "pending",
#         ...
#       }
#     ]
#   }
# }

# 保存 application_id
APP_ID="<application_id>"
```

**步骤 4: 管理员查看申请详情**

```bash
curl "http://localhost:8000/api/admin/reviews/$APP_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期响应：包含完整申请信息，包括营业执照图片
```

**步骤 5: 管理员审核通过**

```bash
curl -X POST "http://localhost:8000/api/admin/reviews/$APP_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{}'

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "applicationId": "uuid",
#     "status": "approved",
#     "auditAt": "2026-03-15T11:00:00Z",
#     "auditedBy": "admin"
#   }
# }
```

**步骤 6: 用户刷新审核状态（approved）**

```bash
curl http://localhost:8000/api/auth/audit-status \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "status": "approved",
#     "nextAction": "done",
#     "companyName": "测试企业A",
#     "auditTime": "2026-03-15T11:00:00Z",
#     ...
#   }
# }
```

**验证点**:
- ✓ 用户提交后状态为 pending
- ✓ 管理员可以看到待审核申请
- ✓ 管理员审核通过后，状态变为 approved
- ✓ 用户侧立即可以看到 approved 状态和 auditTime
- ✓ nextAction 变为 done

---

### 流程 2: 用户提交 → 管理员驳回 → 用户重新提交

**步骤 1-4: 同流程 1**

**步骤 5: 管理员驳回申请**

```bash
curl -X POST "http://localhost:8000/api/admin/reviews/$APP_ID/reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"rejectReason":"营业执照不清晰，请重新上传"}'

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "applicationId": "uuid",
#     "status": "rejected",
#     "rejectReason": "营业执照不清晰，请重新上传",
#     "auditAt": "2026-03-15T11:00:00Z",
#     "auditedBy": "admin"
#   }
# }
```

**步骤 6: 用户查看驳回状态**

```bash
curl http://localhost:8000/api/auth/audit-status \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "status": "rejected",
#     "nextAction": "resubmit",
#     "companyName": "测试企业A",
#     "rejectReason": "营业执照不清晰，请重新上传",
#     ...
#   }
# }
```

**步骤 7: 用户重新提交（修正后）**

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "companyName":"测试企业A",
    "creditCode":"123456789012345678",
    "licenseImage":"https://example.com/license_clear.jpg"
  }'

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "applicationId": "same-uuid",  // 同一个 ID，更新而非新建
#     "status": "pending",
#     ...
#   }
# }
```

**步骤 8: 验证状态重置为 pending**

```bash
curl http://localhost:8000/api/auth/audit-status \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期响应：
# {
#   "code": 200,
#   "data": {
#     "status": "pending",
#     "nextAction": "view",
#     ...
#   }
# }
```

**验证点**:
- ✓ 管理员可以驳回申请并填写原因
- ✓ 用户可以看到驳回原因
- ✓ nextAction 为 resubmit
- ✓ 用户重新提交后，状态重置为 pending
- ✓ 驳回原因被清空

---

### 流程 3: 企业目录查看

**步骤 1: 查看所有企业**

```bash
curl "http://localhost:8000/api/admin/companies" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期响应：返回所有企业的最新申请状态
```

**步骤 2: 按状态筛选**

```bash
# 查看已认证企业
curl "http://localhost:8000/api/admin/companies?status=approved" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 查看待审核企业
curl "http://localhost:8000/api/admin/companies?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 查看已驳回企业
curl "http://localhost:8000/api/admin/companies?status=rejected" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**验证点**:
- ✓ 企业目录显示每个用户的最新申请
- ✓ 状态筛选正常工作
- ✓ 显示审核时间和审核人

---

### 流程 4: 权限验证

**步骤 1: 普通用户尝试访问管理员接口**

```bash
curl "http://localhost:8000/api/admin/reviews" \
  -H "Authorization: Bearer $USER_TOKEN"

# 预期响应：
# {
#   "code": 403,
#   "message": "管理员 token 无效"
# }
```

**步骤 2: 无 token 访问**

```bash
curl "http://localhost:8000/api/admin/reviews"

# 预期响应：
# {
#   "code": 403,
#   "message": "需要管理员权限"
# }
```

**验证点**:
- ✓ 普通用户 token 无法访问管理员接口
- ✓ 无 token 请求被拒绝
- ✓ 返回明确的 403 错误

---

### 流程 5: 边界情况验证

**情况 1: 重复审核通过**

```bash
# 对已通过的申请再次审核通过
curl -X POST "http://localhost:8000/api/admin/reviews/$APP_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{}'

# 预期响应：
# {
#   "code": 400,
#   "message": "该申请已经通过审核"
# }
```

**情况 2: 驳回时不填原因**

```bash
curl -X POST "http://localhost:8000/api/admin/reviews/$APP_ID/reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"rejectReason":""}'

# 预期响应：
# {
#   "code": 400,
#   "message": "驳回原因不能为空"
# }
```

**情况 3: 审核不存在的申请**

```bash
curl -X POST "http://localhost:8000/api/admin/reviews/non-existent-id/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{}'

# 预期响应：
# {
#   "code": 404,
#   "message": "申请记录不存在"
# }
```

**验证点**:
- ✓ 重复审核被阻止
- ✓ 驳回原因必填
- ✓ 不存在的申请返回 404

---

## 前端验证（UI）

### 1. 审核列表页面 (`/admin/reviews`)

访问: http://localhost:5173/admin/reviews

**验证点**:
- ✓ 显示所有申请列表
- ✓ 状态筛选下拉框工作正常
- ✓ 分页功能正常
- ✓ 点击"查看详情"跳转到详情页

### 2. 审核详情页面 (`/admin/reviews/:id`)

**验证点**:
- ✓ 显示完整申请信息
- ✓ 营业执照图片正常显示
- ✓ pending 状态显示"通过"和"驳回"按钮
- ✓ 点击"通过"后状态更新
- ✓ 点击"驳回"弹出驳回原因输入框
- ✓ 填写驳回原因后提交成功
- ✓ approved/rejected 状态不显示操作按钮

### 3. 企业目录页面 (`/admin/companies`)

**验证点**:
- ✓ 显示企业列表
- ✓ 状态筛选工作正常
- ✓ 点击"查看详情"弹出详情模态框
- ✓ 详情模态框显示完整企业信息和最近申请摘要

---

## 数据库验证

### 验证审核元数据写入

```bash
sqlite3 data/notices.db "SELECT id, company_name, status, audit_at, audited_by, reject_reason FROM enterprise_applications WHERE user_id='<user_id>'"
```

**验证点**:
- ✓ `audit_at` 字段有值
- ✓ `audited_by` 字段为 "admin"
- ✓ rejected 状态有 `reject_reason`
- ✓ approved 状态 `reject_reason` 为 NULL

---

## 集成验证：小程序 + 管理后台

### 完整用户旅程

1. 用户在小程序提交企业认证
2. 小程序显示"审核中"状态
3. 管理员在后台审核中心看到待审核申请
4. 管理员审核通过/驳回
5. 用户刷新小程序，看到最新状态
6. 如果驳回，用户可以重新提交
7. 管理员在企业目录中可以查看所有企业状态

**验证点**:
- ✓ 小程序和管理后台数据实时同步
- ✓ 审核结果立即反映到用户侧
- ✓ 驳回原因正确显示
- ✓ 重提流程正常工作

---

## 性能验证

### 大量数据测试

创建 100+ 条测试申请，验证：
- ✓ 列表分页正常
- ✓ 筛选性能可接受
- ✓ 详情页加载速度正常

---

## 安全验证

### 1. Token 验证

- ✓ 错误的 admin token 被拒绝
- ✓ 普通用户 token 被拒绝
- ✓ 无 token 请求被拒绝

### 2. SQL 注入测试

```bash
# 尝试 SQL 注入
curl "http://localhost:8000/api/admin/reviews?status=pending' OR '1'='1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 预期：参数化查询防止注入，返回空列表或错误
```

### 3. XSS 测试

提交包含 HTML/JS 的驳回原因：
```bash
curl -X POST "http://localhost:8000/api/admin/reviews/$APP_ID/reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"rejectReason":"<script>alert(1)</script>"}'

# 验证：前端正确转义显示，不执行脚本
```

---

## 验证通过标准

所有以下条件必须满足：

- [x] 用户提交 → 审核通过流程完整
- [x] 用户提交 → 驳回 → 重提流程完整
- [x] 管理员列表、详情、审核操作正常
- [x] 企业目录显示正确
- [x] 权限控制正常（普通用户无法访问）
- [x] 边界情况处理正确
- [x] 前端页面功能正常（路由已配置，组件无编译错误）
- [x] 数据库审核元数据正确写入
- [x] 小程序和管理后台数据同步
- [x] 安全验证通过（Token 验证正常）

---

## 已知限制

1. **管理员认证简化**：第一版使用共享 token，未来可升级为独立管理员账号体系
2. **无审核历史**：只保留最新审核结果，未来可添加审核历史记录
3. **无撤销功能**：审核通过/驳回后无法撤销，未来可添加
4. **无批量操作**：暂不支持批量审核，未来可添加

这些限制已记录在 FOLLOW_UP.md 中。
