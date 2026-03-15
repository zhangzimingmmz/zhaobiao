## Why

前后端接口已全部实现，但在微信开发者工具中真正联调时暴露出若干对接问题：域名校验拦截（localhost 不在合法域名列表）导致所有请求静默 fallback 到 Mock 数据；首页筛选参数（regionCode、source、purchaseManner、purchaser）未传给后端；FilterSheet 传递的是 label 而非 code；部分页面（audit-status、profile、info-detail、favorites）尚未确认已对接真实接口。需要在一个 change 中集中修复这些联调问题，确保小程序在开发环境下能端到端跑通真实数据。

## What Changes

- **开发环境配置**：说明在微信开发者工具中关闭"合法域名校验"的操作路径，确保 `http://localhost:8000` 可正常请求
- **首页筛选参数传递**：`index.tsx` 中将 `filterValues` 里的 regionCode、source、purchaseManner、purchaser 真正传给 `api.list()`
- **FilterSheet 值映射修复**：`handleFilterApply` 同时保存 `{ code, label }`，API 调用时取 `.code` 字段
- **列表接口移除 Mock fallback**：请求失败时展示空状态而非 Mock 数据（避免掩盖真实问题）；保留骨架屏 loading 体验
- **分页支持**：首页列表支持"加载更多"，不再固定 page=1
- **audit-status 页面接口对接**：确认/补全 `api.auditStatus()` 调用及响应处理
- **info-detail 页面接口对接**：确认使用 `api.detailInfo()` 而非 `detailBid()`
- **profile 页面登录态判断**：从 storage 读取 token，未登录时引导跳转登录页

## Capabilities

### New Capabilities

- `list-filter-params-binding`：首页筛选参数（regionCode/source/purchaseManner/purchaser）与后端 API 的完整绑定，包括 FilterSheet code/label 分离存储
- `list-pagination`：首页列表分页加载（加载更多）
- `page-api-wiring`：audit-status / info-detail / profile 页面与真实接口的对接验证与补全

### Modified Capabilities

- `ui-api-binding`：首页 api.list 调用补充筛选参数传递（需求层级变化）

## Impact

- `miniapp/src/pages/index/index.tsx`：筛选参数传递、分页、移除 Mock fallback
- `miniapp/src/pages/audit-status/index.tsx`：接口对接验证
- `miniapp/src/pages/info-detail/index.tsx`：确认使用 detailInfo 接口
- `miniapp/src/pages/profile/index.tsx`：登录态判断与跳转
- `miniapp/src/components/FilterSheet`：onApply 返回值需同时带 code 和 label
- `docs/` 或 README：补充开发环境联调配置说明（关闭域名校验）
