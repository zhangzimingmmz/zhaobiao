# miniapp Taro UI 迁移技术设计

## Context

- **现状**：miniapp 为 Taro 3.6.27 + React，使用 @tarojs/components 基础组件与自研 TopBar、FilterBar、BottomNav、BidCard 等，样式基于 variables.scss（政务蓝 #1677FF）与 base.scss。
- **约束**：仅微信小程序端；需保持现有功能与接口契约；主题色需与政务蓝一致。
- **利益相关**：C 端用户，需保证体验不降级。

## Goals / Non-Goals

**Goals:**

- 用 Taro UI 替代表单、按钮、步骤条、搜索框等基础控件
- 保持功能等价与主题一致
- 分阶段迁移，每阶段可验证

**Non-Goals:**

- 不改变后端接口
- 不改变 miniapp 功能需求
- 不强求 BottomNav、TopBar、FilterSheet 一定替换（视 POC 结果决定）

## Decisions

### 1. 分阶段迁移顺序

**选择**：Phase 0 基础接入 → Phase 1 表单页 → Phase 2 审核/详情 → Phase 3 首页/筛选 → Phase 4 导航/卡片 → Phase 5 收尾。

**理由**：表单页改动面小、收益明显；首页与筛选依赖 FilterBar/FilterSheet，改造复杂；导航与卡片最后评估，避免过早绑定 AtTabBar 等。

**备选**：大爆炸式一次性替换——风险高，回滚难。

### 2. 主题覆盖方式

**选择**：在 app.scss 引入 taro-ui 样式后，通过 SCSS 变量覆盖或追加覆盖样式，将 Taro UI 主色对齐 #1677FF。

**理由**：Taro UI 支持主题变量；项目已有 variables.scss，可复用。

**备选**：接受 Taro UI 默认蓝——与政务蓝不一致，品牌感弱。

### 3. AtInput / AtButton API 适配

**选择**：直接使用 AtInput 的 value/onChange，替换现有 Input 的 onInput(e.detail.value) 写法；AtButton 使用 type="primary" 等，替换 btn-primary 类。

**理由**：AtInput 与 React 受控模式兼容；改动局部，无需额外封装层。

**备选**：封装一层统一 API——增加抽象，本次不必要。

### 4. BottomNav 与 AtTabBar

**选择**：Phase 4 做 POC，若 AtTabBar 与 switchTab 集成顺畅则替换，否则保留自研 BottomNav。

**理由**：AtTabBar 与 Taro 的 tabBar 配置或 switchTab 的集成方式可能不同，需验证。

**备选**：强制替换——可能引入 tab 切换问题。

### 5. FilterSheet 与 AtFloatLayout

**选择**：Phase 3 评估；若 AtFloatLayout + AtList 能较好还原筛选逻辑则替换，否则保留自研。

**理由**：FilterSheet 含 FILTER_MODES 配置、Picker、自定义布局，改造工作量大。

**备选**：强制替换——可能破坏筛选体验。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| Taro UI 与现有 SCSS 冲突 | Phase 0 先引入，验证无冲突后再改页面 |
| AtTabBar 与 switchTab 不兼容 | Phase 4 做 POC，不行则保留 BottomNav |
| 包体积增大 | 按需引入或仅引入用到的组件；若全量引入可接受则保持 |
| 回归遗漏 | 每 Phase 完成后做一次功能回归 |

## Migration Plan

1. **Phase 0**：npm install taro-ui；app.scss 引入样式；覆盖主题变量；构建与真机验证
2. **Phase 1**：login、register、profile 表单替换
3. **Phase 2**：audit-status、detail、info-detail
4. **Phase 3**：FilterBar、FilterSheet、index 首页
5. **Phase 4**：BottomNav、TopBar、BidCard/InfoCard 评估与替换
6. **Phase 5**：删除冗余样式，全量回归
7. **回滚**：每 Phase 独立提交，有问题可回退到上一 Phase

## Open Questions

- 无。技术方案已明确，可直接进入实现。
