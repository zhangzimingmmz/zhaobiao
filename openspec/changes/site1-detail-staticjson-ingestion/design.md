## Context

站点一原站详情页本身已经把完整正文 HTML 直接嵌入 `#newsText`，并在页面上暴露了 `#originurl a[data-value]`、`#relateinfoid`、`#souceinfoid` 等详情字段。当前爬虫仅抓列表接口 `getFullTextDataNew`，导致 notices 表中的 `content` 实际是列表层压平文本。后端正文渲染已经根据站点分策略处理，但对 `site1` 来说原始结构在落库前已经丢失，渲染层只能做有限的文本切段。

## Goals / Non-Goals

**Goals:**
- 为 `site1` 新增详情页抓取与合并落库能力。
- 让 `site1` 的详情接口优先返回详情层 HTML 正文与原站 `originurl`。
- 支持对历史 `site1` 记录执行详情回填，不要求重跑全量列表采集。
- 保留列表原始 JSON 与详情原始 JSON 的可追溯关系，便于排障与后续规则迭代。

**Non-Goals:**
- 不修改 `site2` 现有详情抓取与落库链路。
- 不在本次变更中引入复杂浏览器自动化作为默认采集路径。
- 不在客户端新增站点级正文解析逻辑。

## Decisions

### 1. `site1` 详情抓取采用“列表后补详情页”的两阶段模式
列表采集继续使用现有全文检索主接口，以其为主索引和时间窗口切片来源；对每条列表记录，再请求 `BASE_URL + linkurl` 对应的详情页 HTML，并从页面中解析正文与原文链接。列表记录提供稳定的 id、category、linkurl 和发布时间，详情页提供 HTML 正文与原站链接，两者合并后落库。

### 2. `raw_json` 改为组合结构，保留 `_list` 与 `_detail`
当前 `site1` 只把列表记录原样写入 `raw_json`，无法追溯详情来源。本次改为与 `site2` 一致的组合结构：

```json
{
  "_list": { ... },
  "_detail": { ... }
}
```

当详情缺失时仍允许只保留 `_list`，但一旦详情抓取成功必须写入 `_detail`。

### 3. `notices.content` 优先保存详情 `infoContent`
对 `site1` 记录，若详情中存在 `infoContent`，则 `notices.content` 使用该 HTML；否则回退到列表 `content`。`origin_url` 同理优先使用详情中的 `originurl`。这样服务端详情接口与正文渲染模块无需自己再去解 `raw_json`，只消费统一列即可。

### 4. 详情提取优先直接解析详情页，不依赖 `staticJson` path 推导
虽然站点一详情页内部会发起 `staticJson` 请求，但页面 HTML 已经包含渲染后的完整正文与原文链接。本次实现优先直接请求详情页并解析 `#newsText`、`#originurl`、`#relateinfoid` 等节点，不把 `staticJson` path 反推作为常规路径。这样可减少路径推导不确定性，保持采集链路稳定。

### 5. 历史回填作为独立任务，不与常规增量耦合
新增一个面向 `site1` 的详情回填任务，只针对已存在的 `(site, id)` 记录补抓详情并 merge 更新。这样可以先上线详情链路，再分批修复历史工程建设公告，不阻塞增量任务上线。

### 6. 正文渲染继续保留来源感知，但 `site1` 优先走 HTML 分支
一旦 `site1` 记录拥有详情 HTML，正文渲染模块应优先按 HTML 清洗和统一样式处理；只有在详情缺失或 HTML 为空时，才回退到当前的文本结构化分段策略。这样兼容新旧数据共存阶段。

## Risks / Trade-offs

- [详情页 DOM 结构变化] → 解析逻辑限定在稳定节点（`#newsText`、`#originurl`、隐藏输入字段），并为缺失节点保留列表层回退。
- [增量任务请求量提升] → 详情抓取增加网络请求，需在增量与补偿任务中加入重试和可选限流。
- [历史数据回填耗时] → 回填独立执行，按分类/日期分批跑，不与常规采集绑定。
- [详情 HTML 带来更脏的样式] → 通过已有 HTML 轻清洗链路处理，避免将原站内联样式直接暴露给小程序。

## Migration Plan

1. 先在 `crawler/site1` 增加详情请求与列表+详情合并能力，并用样本测试验证至少三类公告各一条可抓通。
2. 切换 `server` 详情接口与正文渲染逻辑，让 `site1` 优先消费详情 HTML。
3. 新增历史详情回填任务，对已有 `site1` 记录按分类批量补详情。
4. 回填完成后再根据真实效果决定是否进一步为招标计划做字段化渲染。

## Open Questions

- 三类 category 的详情页 HTML 是否都稳定包含 `#newsText` 与 `#originurl` 节点，若少数页面缺失时是否需要回退到 `staticJson` 抓取。
- `site1` 的 `attachFiles` 是否需要映射到统一附件字段，还是暂只保存在 `raw_json._detail` 中。
