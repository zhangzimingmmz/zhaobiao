## Context

当前小程序的登录和企业认证流程存在用户体验问题。系统采用"手机号登录 + 企业认证"的两步模型，其中：
- 手机号验证码登录是账号创建的入口（首次登录即注册）
- 企业认证是登录后的必要步骤，必须通过审核才能使用系统
- 登录页有一个"没有企业账号？去注册"按钮，跳转到 `/pages/register`
- 企业认证页（`/pages/register`）在 `useEffect` 中检查 token，无 token 则跳回登录页

这导致了一个死循环：用户点击"去注册" → 跳转到认证页 → 检测到未登录 → 提示"请先登录" → 跳回登录页。

产品定位明确：这是企业专用工具，必须完成企业认证才能使用。因此需要重新设计登录后的引导流程，让系统根据用户的认证状态自动引导到正确的页面。

现有技术栈：
- Taro 3.x 小程序框架
- 已有 `api.auditStatus()` 接口返回认证状态（none/pending/rejected/approved）
- 已有企业认证页、审核状态页、个人中心页

## Goals / Non-Goals

**Goals:**
- 消除登录页的误导性"去注册"按钮和死循环问题
- 登录成功后根据认证状态自动路由到正确页面
- 新用户首次登录后自动引导完成企业认证
- 保持现有认证页面的逻辑不变（token 检查、状态预填等）
- 提供清晰的用户提示，说明登录后需要完成认证

**Non-Goals:**
- 不改变手机号登录的实现方式
- 不修改企业认证表单的字段或验证逻辑
- 不改变审核流程或后端接口
- 不创建新的引导页面或多步骤向导

## Decisions

### 1. 移除"去注册"按钮，改为提示文案
- **Decision:** 删除登录页的 `handleRegister` 函数和"去注册"按钮，替换为静态提示文案："首次使用？登录后系统将引导你完成企业认证"
- **Why:** "去注册"这个词在用户心智中是"创建账号"，但实际跳转到的是"企业认证"页面（需要先登录）。改为提示文案可以明确告知用户流程，避免误导。
- **Alternative considered:** 保留按钮但改文案为"了解注册流程"。放弃，因为增加了不必要的点击步骤，不如直接在登录页说明清楚。

### 2. 登录成功后调用审核状态接口并根据状态路由
- **Decision:** 在 `handleLogin` 的成功回调中，先调用 `api.auditStatus()` 获取认证状态，然后根据 `status` 字段决定跳转目标：
  - `none` → `Taro.redirectTo({ url: '/pages/register/index' })` + 提示"登录成功，请完成企业认证"
  - `pending` → `Taro.redirectTo({ url: '/pages/audit-status/index' })` + 提示"登录成功"
  - `rejected` → `Taro.redirectTo({ url: '/pages/register/index' })` + 提示"登录成功，请重新提交企业认证"
  - `approved` → `Taro.switchTab({ url: '/pages/index/index' })` + 提示"登录成功"
- **Why:** 这样可以让系统自动判断用户的下一步动作，新用户无需手动寻找认证入口，已认证用户直接进入首页，流程顺畅。
- **Alternative considered:** 登录后始终跳转到首页，让用户自己去"我的"页面找认证入口。放弃，因为这会增加新用户的操作步骤，且不符合"必须认证才能使用"的产品定位。

### 3. 使用 Promise 链式调用处理异步逻辑
- **Decision:** 将 `api.login()` 和 `api.auditStatus()` 用 Promise 链式调用连接，确保先登录成功、保存 token，再获取认证状态。
- **Why:** 这样可以保证逻辑顺序正确，且代码结构清晰。如果获取认证状态失败，降级到默认行为（跳转首页）。
- **Alternative considered:** 使用 async/await。放弃，因为当前代码风格是 Promise 链，保持一致性更好。

### 4. 保持企业认证页的 token 检查逻辑不变
- **Decision:** 不修改 `/pages/register/index.tsx` 的 `useEffect` 中的 token 检查逻辑。
- **Why:** 这个检查是必要的安全措施，防止用户直接访问认证页而绕过登录。由于现在登录页不再有"去注册"按钮，用户不会再遇到死循环问题。
- **Alternative considered:** 移除 token 检查。放弃，因为这会造成安全漏洞。

### 5. 错误处理和降级策略
- **Decision:** 如果 `api.auditStatus()` 调用失败或返回异常，降级到默认行为：跳转到首页，让用户通过"我的"页面查看认证状态。
- **Why:** 避免因为接口异常导致用户无法登录。首页和"我的"页面都有认证状态的展示和入口，可以作为兜底方案。
- **Alternative considered:** 失败时直接跳转到认证页。放弃，因为可能误导已认证用户。

## Risks / Trade-offs

- [Risk] 登录成功后多调用一次 `api.auditStatus()` 接口，增加了网络请求 → Mitigation: 这个接口已经在"我的"页面和认证页面中使用，性能开销可接受；且可以通过缓存优化
- [Risk] 如果 `api.auditStatus()` 接口响应慢，用户会在登录后等待较长时间 → Mitigation: 显示"登录成功"提示，给用户反馈；如果超时或失败，降级到跳转首页
- [Risk] 用户可能不理解为什么登录后被自动跳转到认证页 → Mitigation: 在跳转时显示明确的提示文案"登录成功，请完成企业认证"
- [Risk] 已认证用户登录时也会调用 `api.auditStatus()`，可能感觉多余 → Mitigation: 这个调用是必要的，因为需要判断状态；且对已认证用户来说，直接跳转首页，体验流畅

## Migration Plan

1. 修改 `miniapp/src/pages/login/index.tsx`：
   - 删除 `handleRegister` 函数
   - 删除"去注册"按钮的 JSX 代码
   - 添加提示文案组件
   - 修改 `handleLogin` 函数，在登录成功后调用 `api.auditStatus()` 并根据状态路由
2. 测试各种场景：
   - 新用户首次登录（status = none）
   - 已提交认证等待审核的用户登录（status = pending）
   - 被驳回的用户登录（status = rejected）
   - 已通过认证的用户登录（status = approved）
   - 接口异常或超时的降级处理
3. 验证企业认证页的 token 检查逻辑仍然正常工作
4. 无需数据迁移或后端改动

## Open Questions

- 是否需要在登录页添加"什么是企业认证"的说明链接？（当前方案是直接在提示文案中说明）
- 如果未来需要支持"游客模式"（无需认证即可浏览部分内容），这个路由逻辑是否需要调整？
