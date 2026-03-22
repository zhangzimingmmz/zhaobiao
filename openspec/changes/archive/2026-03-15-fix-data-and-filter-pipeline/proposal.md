## Why

数据与查询接口全流程存在多处问题：S-code 映射与 site1 实际数据不符（选广安出遂宁）、purchaseNature 未落库导致项目分类筛选无效、002002001 的 tradingsourcevalue 数据源缺失导致 source 筛选无结果。需统一梳理问题并制定解决方案，公共问题采用公共方案。

## 问题汇总（数据与查询全流程）

### 一、编码映射类

| 问题 ID | 描述 | 根因 | 影响范围 |
|---------|------|------|----------|
| **P1** | 选广安出遂宁、选遂宁出眉山 | `_S_TO_REGION` 与 site1 实际 source_name 不符；DATA_STRUCTURE 文档映射错误 | 工程建设、政府采购的 region/source 筛选 |
| **P2** | 002002001 source 筛选恒为 0 | site1 政府采购 API 响应不含 tradingsourcevalue | 工程建设-政府采购 |

### 二、字段未落库类

| 问题 ID | 描述 | 根因 | 影响范围 |
|---------|------|------|----------|
| **P3** | 项目分类筛选无效 | purchaseNature 未落库：表无列、爬虫未映射、API 无参数、前端未传 | 政府采购-采购公告 |

### 三、数据源缺失类（无法从接口补全）

| 问题 ID | 描述 | 根因 | 影响范围 |
|---------|------|------|----------|
| **P4** | 002002001 无 tradingsourcevalue | site1 政府采购接口本身不返回该字段 | 工程建设-政府采购 source 筛选 |

## What Changes

- **P1**：修正 `_S_TO_REGION` 为基于 site1 实际 source_name 的映射（S014→遂宁、S008→眉山、S015→广安 等）
- **P2/P4**：002002001 的 source 筛选：接受数据源限制，或从 zhuanzai 解析地区（备选）
- **P3**：purchaseNature 全链路：表加列、爬虫映射、API 支持 purchaseNature 筛选、前端 buildParams 传 nature

## Capabilities

### New Capabilities

- `purchase-nature-filter`：项目分类（purchaseNature）从落库到 API 筛选到前端传参的完整支持

### Modified Capabilities

- `list-filter-region-source-mapping`（或 notices-api）：S-code 映射修正为基于实际数据的映射表
- `notices-api`：新增 purchaseNature 筛选参数
- `list-filter-params-binding`：buildParams 传入 nature（filterValues.nature?.code）
- `crawler-storage-schema`：notices 表新增 purchase_nature 列

## Impact

- **server/main.py**：_S_TO_REGION 映射表修正；purchaseNature 筛选逻辑
- **crawler**：migrations 新增 purchase_nature 列；storage NOTICES_COLUMNS；site2 core mapped_record
- **miniapp**：buildParams 传 nature
- **docs**：DATA_STRUCTURE 中 S-code 映射表修正（若需与实现一致）
