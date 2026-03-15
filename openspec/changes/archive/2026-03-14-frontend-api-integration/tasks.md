## 1. 开发环境配置（无代码改动，手动操作）

- [ ] 1.1 在微信开发者工具右上角「详情」→「本地设置」→ 勾选「不校验合法域名、web-view、TLS版本以及HTTPS证书」
- [x] 1.2 确认 `miniapp/src/config.ts` 中 `baseUrl` 为 `http://localhost:8000`
- [ ] 1.3 启动后端服务：项目根目录执行 `PYTHONPATH=. python3 -m uvicorn server.main:app --reload --port 8000`
- [ ] 1.4 重新编译小程序，确认首页接口请求不再报「request 合法域名校验出错」
- [x] 1.5 在 `docs/` 目录新建或更新 `开发联调指南.md`，记录上述步骤

## 2. FilterSheet 选项补充 code 映射

- [x] 2.1 将 `FilterSheet/index.tsx` 中 `SOURCE_OPTIONS` 从字符串数组改为 `{ code, label }` 对象数组（使用城市名作为临时 code，后续对齐 tradingsourcevalue 实际值）
- [x] 2.2 将 `REGION_OPTIONS` 同步为 `{ code, label }` 格式（code 使用六位行政区划代码，如 `510100`=成都市）
- [x] 2.3 将 `METHOD_OPTIONS` 改为 `{ code, label }` 格式（code 为 dict_purchase_manner 的 dict_code，如 `1`=公开招标）
- [x] 2.4 修改 `renderGrid` 函数，适配 `{ code, label }` 对象；`draftValue` 存储 code；显示 label
- [x] 2.5 修改 `handleApply` 中 `onApply(type, value, label)` 调用：非时间类型改为 `onApply(type, option.code, option.label)`
- [x] 2.6 修改 `method` 和 `nature` 类型的 `renderBody` 中列表渲染，适配新格式

## 3. index.tsx 筛选参数传递修复

- [x] 3.1 将 `filterValues` state 类型从 `Record<string, string>` 改为 `Record<string, { code: string; label: string }>`
- [x] 3.2 修改 `handleFilterApply(key, value, label)` 存储为 `{ code: value, label: label || value }`
- [x] 3.3 修改 `FilterBar` 的 `filterValues` prop 传值，改为传 `.label` 字段（展示用）
- [x] 3.4 在 `useEffect` 的 `api.list()` 调用中，从 `filterValues` 中取 code 补充以下参数：
  - `regionCode: filterValues.region?.code`
  - `source: filterValues.source?.code`
  - `purchaseManner: filterValues.method?.code`
  - `purchaser: filterValues.purchaser?.code`（purchaser 是文本输入，code 即 label）
- [x] 3.5 实现时间值转换函数 `parseTimeFilter(value)`：将 `today`/`7d`/`30d` 或 `startDate|endDate` 转换为 `{ timeStart, timeEnd }`（格式 `YYYY-MM-DD HH:MM:SS`）
- [x] 3.6 将时间筛选结果通过 `parseTimeFilter` 转换后传给 `api.list()`

## 4. 移除 Mock 数据 fallback

- [x] 4.1 删除 `index.tsx` 中 `MOCK_BY_CATEGORY` 常量及所有引用
- [x] 4.2 将 `catch` 中的 `setList(MOCK_BY_CATEGORY[category] || [])` 改为 `setList([])`（显示 EmptyState）
- [x] 4.3 将接口返回非 200 时的处理也改为 `setList([])`，不显示 Mock 数据

## 5. 首页分页（加载更多）

- [x] 5.1 新增 `page` state（初始 1）和 `isEnd` state（初始 false）
- [x] 5.2 `useEffect` 监听 `category`/筛选参数变化时，重置 `page=1`、`setList([])`、`setIsEnd(false)`
- [x] 5.3 新增 `loadMore` 函数：page+1，追加数据到列表
- [x] 5.4 根据 `total <= page * pageSize` 判断是否到达最后一页，设置 `isEnd=true`
- [x] 5.5 在列表底部添加加载更多 UI：`loading` 中显示 loading 图标；`isEnd` 时显示「已全部加载」；否则显示「加载更多」按钮

## 6. profile 页面接口对接

- [x] 6.1 在 `profile/index.tsx` 的已登录视图中，`useEffect` 调用 `api.auditStatus()`
- [x] 6.2 将返回的 `companyName`、`creditCode`、`status` 存入 state
- [x] 6.3 将企业信息卡片中的「企业名称」「—」「已认证」等硬编码替换为真实 state 值
- [x] 6.4 `status === 'pending'` 时显示「审核中」，`status === 'rejected'` 时显示「审核未通过」
- [x] 6.5 `api.auditStatus()` 返回 `code: 404` 时显示「未提交企业认证」入口，点击跳转 `/pages/register/index`
- [x] 6.6 `api.auditStatus()` 返回 `code: 401` 时清除 token 并跳转登录页

## 7. 验证与修复其他页面错误处理

- [x] 7.1 在 `audit-status/index.tsx` 的 `catch` 中，如果响应 code 为 401，跳转到登录页
- [x] 7.2 确认 `info-detail/index.tsx` 的空状态（`!detail`）能在接口返回 404 时正确触发
- [x] 7.3 验证 `detail/index.tsx`（招投标详情）能正常展示后端返回的真实数据字段

## 8. 端到端联调验证

- [x] 8.1 确保 `notices.db` 中有数据（运行爬虫或手动插入测试数据）
- [x] 8.2 开发者工具中打开首页，确认 Network 中有真实 `/api/list` 请求并返回 200
- [x] 8.3 验证地区筛选选择后，Network 请求中携带 `regionCode` 参数
- [x] 8.4 验证采购方式筛选选择后，Network 请求中携带 `purchaseManner` 参数
- [x] 8.5 验证时间筛选（「今天」）后，Network 请求中携带 `timeStart` 和 `timeEnd` 参数
- [x] 8.6 验证点击列表项能跳转详情页并展示真实数据
- [x] 8.7 走通登录 → profile 页查看企业信息完整流程
