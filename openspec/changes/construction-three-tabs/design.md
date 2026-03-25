## Context

当前小程序工程建设板块只显示"招标文件预公示"（category 002001010）的单一内容，没有二级 Tab 切换。根据最新产品需求（PDF 设计稿），需要恢复为三个可切换的 Tab，让用户能够查看招标计划（002001009）、招标文件预公示（002001010）和招标公告（002001001）三类信息。

现有代码结构：
- `SECONDARY_MAP.construction` 当前为空数组 `[]`
- `getCategory()` 函数直接返回 `'002001010'`
- 工程建设板块显示固定的小节标题"招标文件预公示"
- 后端 API 已支持三个 category，数据库已有三个分类的数据

## Goals / Non-Goals

**Goals:**
- 在工程建设板块添加三个可切换的二级 Tab
- 根据选中的 Tab 动态请求不同 category 的数据
- 移除固定的"招标文件预公示"小节标题
- 保持与政府采购和信息公开板块的 UI 一致性

**Non-Goals:**
- 不修改后端 API（已支持所需的 category）
- 不修改数据库结构（已有三个分类的数据）
- 不改变其他板块（政府采购、信息公开）的行为
- 不修改 SecondaryTabs 组件本身（已满足需求）

## Decisions

### Decision 1: 使用现有的 SecondaryTabs 组件

**选择**: 复用现有的 `SecondaryTabs` 组件来实现工程建设的三个 Tab

**理由**:
- 政府采购板块已经使用 SecondaryTabs 实现了二级 Tab 切换
- 保持 UI 一致性，用户体验统一
- 避免重复造轮子，减少维护成本

**替代方案**: 创建新的 Tab 组件
- 被拒绝原因：增加代码复杂度，破坏 UI 一致性

### Decision 2: Tab ID 命名约定

**选择**: 使用语义化的英文 ID：`plan`、`preview`、`announcement`

**理由**:
- 与政府采购的 `intention`、`announcement` 命名风格一致
- 代码可读性好，便于维护
- 避免直接使用 category code（002001009）作为 ID

**Tab 配置**:
```typescript
construction: [
  { id: 'plan', label: '招标计划' },
  { id: 'preview', label: '招标文件预公示' },
  { id: 'announcement', label: '招标公告' },
]
```

### Decision 3: getCategory() 函数扩展

**选择**: 在 `getCategory()` 函数中添加 construction 的分支逻辑

**实现**:
```typescript
function getCategory(primary, secondary, announcementType) {
  if (primary === 'construction') {
    if (secondary === 'plan') return '002001009'
    if (secondary === 'preview') return '002001010'
    if (secondary === 'announcement') return '002001001'
    return '002001010' // 默认值
  }
  // ... 其他逻辑保持不变
}
```

**理由**:
- 集中管理 category 映射逻辑
- 提供默认值确保向后兼容
- 与现有代码风格一致

### Decision 4: 移除固定小节标题的条件判断

**选择**: 在渲染逻辑中添加条件，当 construction 有 secondary tabs 时不显示固定标题

**实现**:
```typescript
{primary === 'construction' && secondaryTabs.length === 0 && (
  <View className="index-page__section-head">
    <Text className="index-page__section-head-title">招标文件预公示</Text>
  </View>
)}
```

**理由**:
- 保持代码向后兼容（如果未来需要回退到单一板块）
- 清晰的条件判断，易于理解
- 不影响其他板块的渲染逻辑

### Decision 5: 默认 Tab 选择

**选择**: 默认选中第一个 Tab（招标计划）

**理由**:
- 与政府采购板块的行为一致（默认选中第一个 Tab）
- 符合用户从左到右的阅读习惯
- 简化状态初始化逻辑

## Risks / Trade-offs

### Risk 1: 用户习惯变化
**风险**: 用户已习惯直接看到"招标文件预公示"，现在需要点击 Tab 切换

**缓解措施**:
- 默认选中第一个 Tab，用户进入后立即看到内容
- Tab 切换交互简单直观，学习成本低
- 可以通过用户反馈调整默认选中的 Tab

### Risk 2: 数据加载性能
**风险**: 三个 Tab 可能导致更频繁的 API 请求

**缓解措施**:
- 现有代码已有分页和缓存机制
- 每次只加载当前 Tab 的数据，不预加载
- 后端 API 性能已验证，支持三个 category

### Risk 3: 与旧规范的冲突
**风险**: 现有规范文档（`engineering-tender-preview-and-c-suppression/spec.md`）明确说"取消二级 Tab"

**缓解措施**:
- 本次变更后需要更新该规范文档
- 在 proposal 中明确说明这是产品决策的变更
- 保留变更历史，便于追溯

## Migration Plan

### 部署步骤
1. 合并代码到主分支
2. 本地测试三个 Tab 的切换和数据加载
3. 小程序编译并上传到微信后台
4. 提交审核并发布

### 回滚策略
如果发现严重问题，可以快速回滚：
1. 将 `SECONDARY_MAP.construction` 改回空数组 `[]`
2. 恢复固定小节标题的渲染逻辑
3. 重新编译并发布小程序

### 验证清单
- [ ] 三个 Tab 能正常切换
- [ ] 每个 Tab 显示对应 category 的数据
- [ ] 筛选功能在每个 Tab 下正常工作
- [ ] 收藏功能在每个 Tab 下正常工作
- [ ] 不影响政府采购和信息公开板块

## Open Questions

无待解决问题。所有技术决策已明确，可以开始实施。
