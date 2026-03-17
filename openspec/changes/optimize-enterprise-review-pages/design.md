## Context

当前运营后台存在两个企业审核相关页面：
- **ReviewsPage** (`/reviews`): 显示所有企业申请记录，默认筛选待审核状态
- **CompaniesPage** (`/companies`): 显示每个用户的最新申请记录，无筛选器

两个页面的核心差异：
- ReviewsPage 返回所有历史申请（一个用户可能有多条记录）
- CompaniesPage 返回去重后的企业列表（每个用户只显示最新申请）

当前问题：
1. 菜单命名不清晰（"企业审核" vs "企业目录"），用户不理解两者区别
2. CompaniesPage 缺少筛选器，无法按状态查询
3. 代码存在重复（表格列定义、状态标签等）

技术约束：
- 前端使用 React + Ant Design Pro Components
- 后端 API 已支持 status 参数筛选
- 需保持向后兼容，不破坏现有功能

## Goals / Non-Goals

**Goals:**
- 明确两个页面的职责定位，通过重命名菜单项提升用户理解
- 为 CompaniesPage 添加状态筛选功能，提升查询效率
- 减少代码重复，抽取共用组件
- 保持现有 API 不变，仅优化前端实现

**Non-Goals:**
- 不合并两个页面（保留不同视角的价值）
- 不修改后端 API 接口
- 不改变数据库查询逻辑
- 不实现 Tab 切换视图（保持简单）

## Decisions

### 决策 1: 保留两个页面，重命名菜单项

**选择**: 保留 ReviewsPage 和 CompaniesPage，但重命名菜单项以明确职责

**理由**:
- 两个页面服务于不同的使用场景：
  - ReviewsPage: 审核工作台，处理待审核队列（高频操作）
  - CompaniesPage: 企业管理目录，查看企业当前状态（低频查询）
- 合并会降低审核效率（每次都要手动筛选待审核）
- 代码重复可以通过抽取组件解决

**命名方案**:
```
旧名称              新名称              职责
─────────────────────────────────────────────────
企业审核 (/reviews)  → 审核队列          处理待审核申请
企业目录 (/companies) → 企业管理          查看企业状态
```

**替代方案**:
- 方案 A: 合并成一个页面，用开关切换"显示历史申请"
  - 缺点: 增加高频操作的步骤，降低审核效率
- 方案 B: 合并成 Tab 视图
  - 缺点: 增加交互复杂度，Tab 切换不够直观

### 决策 2: 为 CompaniesPage 添加 ProTable 搜索表单

**选择**: 使用 Ant Design ProTable 的 `search` 配置添加状态筛选器

**理由**:
- ProTable 内置搜索表单支持，无需自定义 UI
- 与 ReviewsPage 保持一致的交互体验
- 自动处理表单状态和 API 参数传递

**实现方式**:
```typescript
<ProTable
  columns={columns}  // status 列添加 valueType: "select"
  request={async (params) => {
    const status = params.status || undefined;  // 默认不传 status（显示全部）
    const url = status 
      ? `/api/admin/companies?status=${status}&page=${page}&pageSize=${pageSize}`
      : `/api/admin/companies?page=${page}&pageSize=${pageSize}`;
    // ...
  }}
  search={{
    labelWidth: "auto",
    defaultCollapsed: false,  // 默认展开搜索表单
  }}
  form={{
    initialValues: { status: undefined },  // 默认不选择任何状态（显示全部）
  }}
/>
```

**关键点**:
- `status` 列添加 `valueType: "select"` 和 `valueEnum` 配置
- `form.initialValues` 设置为 `undefined`（不传 status 参数）
- ReviewsPage 保持 `initialValues: { status: "pending" }`（默认待审核）

**替代方案**:
- 方案 A: 自定义筛选器 UI
  - 缺点: 增加代码量，与 ProTable 集成复杂
- 方案 B: 使用独立的 Select 组件
  - 缺点: 需要手动管理状态和 API 调用

### 决策 3: 抽取共用组件

**选择**: 创建共用组件减少代码重复

**抽取内容**:
1. **表格列定义**: 企业名称、法人信息、状态等列配置
2. **状态标签渲染**: 统一的状态显示逻辑（已在 `statusLabels.ts` 中）
3. **企业信息渲染**: 企业名称 + 用户名、法人 + 手机号的双行显示

**不抽取的内容**:
- 操作列（ReviewsPage 有"查看"按钮，CompaniesPage 无操作）
- API 调用逻辑（两个接口返回的数据范围不同）

**实现方式**:
```typescript
// admin-frontend/src/components/EnterpriseColumns.tsx
export const createEnterpriseColumns = (options?: {
  showActions?: boolean;
  onView?: (record: ReviewItem) => void;
}): ProColumns<ReviewItem>[] => {
  return [
    {
      title: "登录名 / 企业标识",
      dataIndex: "companyName",
      key: "company",
      render: (_, r) => (
        <span>
          {r.companyName}
          <br />
          <span style={{ color: "#8c8c8c", fontSize: 12 }}>{r.username}</span>
        </span>
      ),
    },
    // ... 其他共用列
  ];
};
```

## Risks / Trade-offs

### 风险 1: 用户习惯改变
**风险**: 菜单项重命名可能导致用户短期内找不到功能

**缓解措施**:
- 保持 URL 路径不变（`/reviews` 和 `/companies`）
- 菜单顺序不变
- 功能完全一致，只是名称更清晰

### 风险 2: 筛选器默认值混淆
**风险**: ReviewsPage 默认"待审核"，CompaniesPage 默认"全部"，可能造成混淆

**缓解措施**:
- 通过菜单名称明确职责："审核队列"暗示待审核，"企业管理"暗示全部
- 筛选器状态清晰可见，用户可随时切换
- 符合用户心智模型（审核工作台关注待审核，管理目录查看全部）

### 风险 3: 代码抽取过度
**风险**: 过度抽取共用组件可能降低代码可读性

**缓解措施**:
- 只抽取真正重复的部分（表格列定义）
- 保持组件简单，不引入复杂的配置
- 如果两个页面后续需求分化，可以随时拆分

## Migration Plan

### 部署步骤

1. **前端代码修改**
   ```bash
   # 修改文件
   - admin-frontend/src/components/Layout.tsx (菜单重命名)
   - admin-frontend/src/pages/CompaniesPage.tsx (添加筛选器)
   - admin-frontend/src/components/EnterpriseColumns.tsx (新建共用组件)
   ```

2. **本地测试**
   ```bash
   cd admin-frontend
   npm run dev
   # 验证：
   # - 菜单名称已更新
   # - CompaniesPage 筛选器工作正常
   # - ReviewsPage 功能不受影响
   ```

3. **构建部署**
   ```bash
   cd admin-frontend
   npm run build
   docker-compose -f docker-compose.backend.yml restart admin-frontend
   ```

4. **生产验证**
   - 访问 https://admin-zhaobiao.zhangziming.cn
   - 验证菜单名称
   - 测试 CompaniesPage 筛选功能
   - 确认 ReviewsPage 正常工作

### 回滚策略

- 前端修改为纯 UI 优化，不涉及 API 变更
- 如需回滚，直接部署旧版本前端代码即可
- 无数据库变更，无需数据迁移

## Open Questions

1. **是否需要在 CompaniesPage 添加"查看详情"操作？**
   - 当前 CompaniesPage 无操作列，只能查看列表
   - 如需查看详情，需要跳转到 ReviewsPage
   - 建议：暂不添加，保持页面简洁

2. **是否需要统计数据展示？**
   - 例如：待审核数量、已通过数量、已驳回数量
   - 建议：可在 DashboardPage 添加统计卡片，不在列表页添加

3. **是否需要批量操作？**
   - 例如：批量审核、批量导出
   - 建议：暂不实现，等待实际需求反馈
