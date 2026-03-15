## Context

前后端代码均已实现，但在微信开发者工具首次联调时发现以下问题：

1. **域名校验拦截**：微信小程序默认校验请求域名合法性，`http://localhost:8000` 不在合法域名列表中，导致所有接口请求被拦截，页面静默 fallback 到 Mock 数据，开发者感知不到真实错误
2. **筛选参数丢失**：`index.tsx` 的 `api.list()` 调用只传 `category` 和 `keyword`，FilterSheet 选出的 region/source/purchaseManner/purchaser 参数从未传给后端
3. **FilterSheet 只存 label 不存 code**：`handleFilterApply` 存的是显示名（如"成都市"），API 需要 code（如 regionCode `510100`）。但当前 FilterSheet 的 `source` 和 `region` 选项只有 label 字符串，没有 code 映射
4. **profile 页面企业信息硬编码**：登录态判断已实现，但企业名称/信用代码/认证状态显示的是硬编码占位符，没有调用审核状态接口
5. **audit-status / info-detail 接口已对接**：经过代码检查，这两个页面实际已经对接了真实接口，不需要修改
6. **无分页**：首页固定 `page=1, pageSize=10`

## Goals / Non-Goals

**Goals:**
- 修复联调阻塞问题，使开发环境下接口请求能正常到达后端
- 让 FilterSheet 的筛选结果真正传给后端（正确的 code 值）
- profile 页面展示真实用户/企业信息
- 补充首页分页（加载更多）
- 在 README 或 docs 中记录开发环境配置步骤

**Non-Goals:**
- 不做生产环境域名配置（需要另外部署后端和配置 HTTPS）
- 不实现收藏后端接口（`/api/favorites`，属于 `miniapp-favorites-flow` change）
- 不改造 FilterSheet 的 UI 结构

## Decisions

### 决策 1：FilterSheet 的 source / region 选项补充 code 映射

当前 `SOURCE_OPTIONS` 是纯字符串数组（只有 label）。需改为 `{ label, code }` 对象数组，code 使用行政区划代码（四川省各地市 tradingsourcevalue 实际值）。

**source 参数**：映射到后端 `notices.tradingsourcevalue` 字段。该字段在 site1 存储的是市级行政区划代码（6位数字，如 510100=成都市）。需确认实际数据库中的值后再确定映射表。

**region 参数**：映射到后端 `regionCode` 参数，同样是行政区划代码。两者可以共用同一份 code 映射表。

**短期方案**：先用 label 作为 source 的筛选值（因为 tradingsourcevalue 实际值未知），将 source 的 filterSheet onApply 传 `{ code: label, label }` — 即前期先用 label 过滤，联调真实数据时再校准 code。

### 决策 2：index.tsx 中 filterValues 改为存 `{ code, label }`

`filterValues` state 的每个 key 存 `{ code: string, label: string }` 对象，API 调用时取 `.code`，FilterBar 展示时取 `.label`。

### 决策 3：profile 页面调用 audit-status 接口展示企业信息

登录后 profile 页面调用 `api.auditStatus()`，将 `companyName`、`creditCode`、`status` 展示到对应位置，替换硬编码占位符。

### 决策 4：首页分页使用"加载更多"模式

维护 `page` state，初始为 1；列表底部加"加载更多"按钮（`loading || isEnd` 控制显示）；切换 tab/筛选时重置 `page=1` 并清空列表。

## Risks / Trade-offs

- [风险] source 的 code 映射（tradingsourcevalue）需要对齐实际爬虫入库值 → **缓解**：先用 label 作为 code 筛选，联调时通过 `/api/list?source=成都市` 验证，不行再查库确认实际值
- [Trade-off] 移除 Mock fallback 后空库会显示空列表 → 预期行为，开发时需先跑爬虫或手动插入测试数据

## Migration Plan

1. 开发者工具关闭域名校验（无代码改动）
2. 修改 FilterSheet + index.tsx（无破坏性变更）
3. 修改 profile 页面（新增接口调用）
4. 补充开发环境文档
