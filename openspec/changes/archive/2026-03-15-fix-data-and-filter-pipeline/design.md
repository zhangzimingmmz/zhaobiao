## Context

- **P1**：`_S_TO_REGION` 当前按 DATA_STRUCTURE 文档，与实际 site1 数据不符。实际对应：S014→遂宁、S008→眉山、S015→广安 等（见探索阶段 SQL 查询 source_name）。
- **P2/P4**：002002001 的 site1 API 不返回 tradingsourcevalue，无法从接口补全。
- **P3**：site2 采购公告 API 返回 purchaseNature（1/2/3），但表无列、爬虫未映射、API 未支持、前端未传。

## Goals / Non-Goals

**Goals:**
- 修正 S-code 映射，使 region/source 筛选与 site1 实际数据一致
- purchaseNature 全链路：落库 → API 筛选 → 前端传参
- 明确 002002001 source 筛选的边界与可选缓解

**Non-Goals:**
- 不改造 site1 政府采购接口（数据源不可控）
- 不实现从 zhuanzai 文本解析地区（复杂度高，收益有限）

## Decisions

### 1. S-code 映射修正（P1）

**决策**：用 site1 实际 `source_name` 与行政区划的对应关系，重写 `_S_TO_REGION`。映射表基于 SQL 查询结果：

```
S001→510100(成都/省平台), S002→510100(成都), S003→510600(德阳), S004→510700(绵阳),
S005→511000(内江), S006→511100(乐山), S007→510800(广元), S008→511400(眉山),
S009→510300(自贡), S010→511800(雅安), S011→511500(宜宾), S012→510400(攀枝花),
S013→510500(泸州), S014→510900(遂宁), S015→511600(广安), S016→511300(南充),
S017→511700(达州), S018→512000(资阳), S019→511900(巴中), S020→513200(阿坝),
S021→513300(甘孜), S022→513400(凉山)
```

**理由**：实际数据为准，避免选广安出遂宁。

**备选**：维护 zhuanzai→地区解析 → 复杂度高，且 S-code 已稳定。

### 2. 002002001 source 筛选（P2/P4）

**决策**：接受数据源限制。002002001 的 source 筛选在 tradingsourcevalue 为空时恒为 0，不额外实现从 zhuanzai 解析。在接口文档或 UI 提示中说明「工程建设-政府采购暂不支持按交易来源筛选」。

**理由**：接口不提供，解析 zhuanzai 成本高、易错。

**备选**：从 zhuanzai 解析 → 暂不采用。

### 3. purchaseNature 全链路（P3）

**决策**：按标准落库→API→前端流程实现。

| 层级 | 方案 |
|------|------|
| 存储 | migrations 新增 `purchase_nature TEXT`；storage NOTICES_COLUMNS 增加该列；_row_to_tuple 支持 |
| 爬虫 | site2 core mapped_record 增加 `purchase_nature: row.get("purchaseNature") or detail.get("purchaseNature")` |
| API | `/api/list` 新增 `purchaseNature: Optional[str]`，SQL 条件 `purchase_nature = ?` |
| 前端 | buildParams 增加 `purchaseNature: filterValues.nature?.code` |
| 列表返回 | _row_list_item 增加 `purchaseNature` 字段（若接口文档需要） |

**理由**：API 已有数据，补齐链路即可。

### 4. 公共方案：映射表维护

**决策**：S-code 等映射表集中在 server 层维护，与 crawler 解耦。crawler 只负责落库原始字段，不做编码转换。

**理由**：职责清晰，映射变更只需改 server。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 新映射表仍有遗漏 | 与 DB 实际 source_name 逐条核对，补充 S001 等省平台 |
| purchase_nature 迁移 | 新列可空，历史数据为 NULL，不影响现有查询 |
| 002002001 用户困惑 | 在空结果时提示「该类型暂不支持按来源筛选」 |

## Migration Plan

1. 执行 migration 添加 purchase_nature 列
2. 部署 server 修正（S-code 映射 + purchaseNature 筛选）
3. 部署 site2 爬虫（写入 purchase_nature）
4. 部署前端（buildParams 传 nature）
5. 可选：对 00101 做一次增量/全量 backfill 补全 purchase_nature（若历史 raw_json 含该字段可解析）
