### Requirement: profile 页面展示真实用户企业信息
`profile/index.tsx` 的已登录视图 SHALL 调用 `api.auditStatus()` 获取企业认证信息，将 `companyName`、`creditCode`、认证状态等字段展示到对应位置，替换现有硬编码占位符（「企业名称」「—」「已认证」）。

#### Scenario: 已登录且有审核通过的企业信息
- **WHEN** 用户已登录，`api.auditStatus()` 返回 `status: 'approved'`
- **THEN** profile 页面显示真实 `companyName`、`creditCode`，认证状态显示「已认证」

#### Scenario: 已登录但企业审核中
- **WHEN** `api.auditStatus()` 返回 `status: 'pending'`
- **THEN** 认证状态显示「审核中」，企业名称/信用代码显示真实值

#### Scenario: 已登录但无企业申请
- **WHEN** `api.auditStatus()` 返回 `code: 404`
- **THEN** 企业信息区域显示「未提交企业认证」，并提供跳转注册页的入口

#### Scenario: 未登录时不调用接口
- **WHEN** `token` 不存在（未登录）
- **THEN** 直接渲染「未登录」视图，不调用 `api.auditStatus()`

### Requirement: 开发环境配置文档
项目 SHALL 在 `docs/` 或根目录 README 中补充开发联调配置步骤，说明如何在微信开发者工具中关闭合法域名校验，以及如何启动本地后端服务。

#### Scenario: 开发者首次配置
- **WHEN** 开发者按照文档步骤操作（关闭域名校验 + 启动 uvicorn + 开发者工具编译）
- **THEN** 首页能正常请求 `http://localhost:8000/api/list` 并展示真实数据

### Requirement: 验证 audit-status 和 info-detail 接口对接完整性
`audit-status/index.tsx` 和 `info-detail/index.tsx` 已调用对应接口，SHALL 确认错误处理路径覆盖：接口返回非 200 code 或 401 时需有合理的用户提示（Toast 或跳转登录）。

#### Scenario: audit-status 返回 401（token 失效）
- **WHEN** token 过期，`api.auditStatus()` 返回 `code: 401`
- **THEN** 页面显示 Toast 提示「登录已过期」并跳转到登录页

#### Scenario: info-detail 接口返回空数据
- **WHEN** `api.detailInfo(id)` 返回 `code: 404` 或 data 为 null
- **THEN** 页面显示「暂无内容」空状态（已有 empty 渲染，确认触发逻辑正确）
