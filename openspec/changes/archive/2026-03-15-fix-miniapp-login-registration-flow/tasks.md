## 1. 修改登录页面 UI

- [x] 1.1 删除 `handleRegister` 函数
- [x] 1.2 删除"没有企业账号？去注册"按钮的 JSX 代码（`login-page__register` 相关代码）
- [x] 1.3 添加提示文案组件，显示"首次使用？登录后系统将引导你完成企业认证"
- [x] 1.4 确保提示文案使用 `text-caption` 样式，位置在登录按钮和用户协议之间

## 2. 实现登录后的智能路由逻辑

- [x] 2.1 修改 `handleLogin` 函数，在登录成功后调用 `api.auditStatus()` 获取认证状态
- [x] 2.2 实现 Promise 链式调用：`api.login()` → 保存 token → `api.auditStatus()` → 根据状态路由
- [x] 2.3 实现 `status === 'none'` 的路由逻辑：显示"登录成功，请完成企业认证"，跳转到 `/pages/register/index`
- [x] 2.4 实现 `status === 'pending'` 的路由逻辑：显示"登录成功"，跳转到 `/pages/audit-status/index`
- [x] 2.5 实现 `status === 'rejected'` 的路由逻辑：显示"登录成功，请重新提交企业认证"，跳转到 `/pages/register/index`
- [x] 2.6 实现 `status === 'approved'` 的路由逻辑：显示"登录成功"，使用 `switchTab` 跳转到 `/pages/index/index`

## 3. 实现错误处理和降级策略

- [x] 3.1 添加 `api.auditStatus()` 调用失败的 catch 处理
- [x] 3.2 实现降级逻辑：接口失败时显示"登录成功"，跳转到首页
- [x] 3.3 确保所有跳转都有适当的延迟（500-1000ms），让用户能看到提示信息
- [x] 3.4 保持 `finally` 中的 `setLoading(false)` 逻辑不变

## 4. 测试和验证

- [x] 4.1 测试新用户首次登录场景（status = none），验证自动跳转到企业认证页
- [x] 4.2 测试审核中用户登录场景（status = pending），验证跳转到审核状态页
- [x] 4.3 测试被驳回用户登录场景（status = rejected），验证跳转到企业认证页并显示重新提交提示
- [x] 4.4 测试已认证用户登录场景（status = approved），验证跳转到首页
- [x] 4.5 测试接口异常场景，验证降级逻辑正常工作
- [x] 4.6 验证企业认证页的 token 检查逻辑仍然正常工作（直接访问认证页会被拦截）
- [x] 4.7 验证登录页面的其他功能（手机号输入、验证码获取、用户协议显示）保持不变
