# /api/list 筛选条件测试用例

> 目的：覆盖所有查询接口的筛选条件，找出问题，为后续方案设计提供依据。  
> 接口：`GET /api/list`  
> 参考：`docs/接口文档-前端与小程序.md`、`server/main.py` 232-290 行

---

## 一、接口参数总览

| 参数 | 类型 | 必填 | 后端 SQL 逻辑 | 前端来源 |
|------|------|------|---------------|----------|
| page | int | 是 | OFFSET | buildParams |
| pageSize | int | 是 | LIMIT | buildParams |
| category | string | 是 | `category_num = ?` | getCategory(primary,secondary) |
| keyword | string | 否 | `title/content/description LIKE %?%` | 搜索框 |
| timeStart | string | 否 | `publish_time >= ?` | parseTimeFilter |
| timeEnd | string | 否 | `publish_time <= ?` | parseTimeFilter |
| regionCode | string | 否 | `region_code = ? OR tradingsourcevalue = ?` | FilterSheet region |
| source | string | 否 | `tradingsourcevalue = ?` | FilterSheet source |
| purchaseManner | string | 否 | `purchase_manner = ?` | FilterSheet method |
| purchaser | string | 否 | `purchaser LIKE %?%` | FilterSheet purchaser |

---

## 二、数据现状（用于构造有效测试值）

```
category_num:  00101(1516), 59(2167), 002002001(1513), 002001009(625), 002001001(599)
purchase_manner: 1(553+), 3, 4, 6 等
publish_time: 2026-03-01 ~ 2026-03-14
site1 tradingsourcevalue: S001,S002,S011,S020,S021,S022 等（非 510100）
site2 region_code: 510101,510104,511701 等（区县级，非 510100）
site2 tradingsourcevalue: 全空
```

---

## 三、单参数测试用例

### 3.1 分页参数

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| P01 | 默认分页 | `page=1&pageSize=10&category=00101` | 返回 10 条，total≥10 | - | 待测 |
| P02 | 第二页 | `page=2&pageSize=10&category=00101` | 返回第 11-20 条 | - | 待测 |
| P03 | 大 pageSize | `page=1&pageSize=100&category=00101` | 最多 100 条 | - | 待测 |
| P04 | pageSize 边界 | `page=1&pageSize=1&category=00101` | 返回 1 条 | - | 待测 |
| P05 | 超大页码 | `page=9999&pageSize=10&category=00101` | 返回空列表，total 不变 | - | 待测 |

### 3.2 category

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| C01 | 采购公告 | `category=00101&page=1&pageSize=10` | 返回 site2 采购公告，total=1516 | - | 待测 |
| C02 | 采购意向 | `category=59&page=1&pageSize=10` | 返回 site2 采购意向，total=2167 | - | 待测 |
| C03 | 招标计划 | `category=002001009&page=1&pageSize=10` | total=625 | - | 待测 |
| C04 | 招标公告 | `category=002001001&page=1&pageSize=10` | total=599 | - | 待测 |
| C05 | 政府采购 | `category=002002001&page=1&pageSize=10` | total=1513 | - | 待测 |
| C06 | 无效 category | `category=invalid&page=1&pageSize=10` | total=0，list=[] | - | 待测 |
| C07 | 空 category | 不传 category | 后端应如何处理？当前可能全表扫描 | - | 待测 |

### 3.3 keyword

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| K01 | 标题关键词 | `category=00101&keyword=成都&page=1&pageSize=10` | 标题含「成都」的记录 | - | 待测 |
| K02 | 内容关键词 | `category=00101&keyword=招标&page=1&pageSize=10` | title/content/description 任一含「招标」 | - | 待测 |
| K03 | 无匹配关键词 | `category=00101&keyword=不存在关键词xyz&page=1&pageSize=10` | total=0，list=[] | - | 待测 |
| K04 | 空关键词 | `keyword=` 或不传 | 不过滤，等同于无 keyword | - | 待测 |
| K05 | 特殊字符 | `keyword=%&page=1` | 不报错，LIKE 转义正确 | - | 待测 |

### 3.4 timeStart / timeEnd

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| T01 | 时间范围 | `category=00101&timeStart=2026-03-10 00:00:00&timeEnd=2026-03-14 23:59:59&page=1&pageSize=10` | 3 月 10-14 日发布的记录 | **total=687**（实测） | ✅ 通过 |
| T02 | 单日 | `timeStart=2026-03-10 00:00:00&timeEnd=2026-03-10 23:59:59&category=00101` | 仅 3 月 10 日 | - | 待测 |
| T03 | 仅 timeStart | `timeStart=2026-03-10 00:00:00&category=00101` | publish_time>=3 月 10 日 | - | 待测 |
| T04 | 仅 timeEnd | `timeEnd=2026-03-05 23:59:59&category=00101` | publish_time<=3 月 5 日 | - | 待测 |
| T05 | 无数据时间范围 | `timeStart=2025-01-01&timeEnd=2025-01-31&category=00101` | total=0 | - | 待测 |

### 3.5 regionCode

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| R01 | 成都市（前端传 510100） | `regionCode=510100&category=00101&page=1&pageSize=10` | 返回成都地区记录 | **total=284**（前缀 5101% 匹配） | ✅ 通过 |
| R02 | 达州市（511700） | `regionCode=511700&category=00101` | 达州地区记录 | **total=70**（前缀 5117% 匹配） | ✅ 通过 |
| R03 | site1 地区（S020） | `regionCode=S020&category=002001009` | 阿坝州 site1 记录 | **total=42**（tradingsourcevalue 匹配） | ✅ 通过 |
| R04 | 空 regionCode | 不传 | 不过滤 | - | 待测 |

**问题摘要**：前端使用行政区划代码（510100=成都市），后端精确匹配 `region_code`/`tradingsourcevalue`。site2 存区县代码（510101 等），site1 存 S001/S020 等，均与 510100 不匹配。

### 3.6 source

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| S01 | 成都市（前端传 510100） | `source=510100&category=002001009&page=1&pageSize=10` | 成都来源记录 | **total=36**（S001 映射 + site2 前缀） | ✅ 通过 |
| S02 | site1 实际值（S020） | `source=S020&category=002001009` | 阿坝州记录 | **total=42** | ✅ 通过 |
| S03 | site2 数据 | `source=510100&category=00101` | site2 region_code 前缀匹配 | **total=284** | ✅ 通过 |
| S04 | 空 source | 不传 | 不过滤 | - | 待测 |

**问题摘要**：前端传行政区划代码，后端用 `tradingsourcevalue` 精确匹配。site1 存 S001/S020 等，site2 不填该字段。

### 3.7 purchaseManner

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| M01 | 公开招标 | `purchaseManner=1&category=00101&page=1&pageSize=10` | 仅 purchase_manner=1 的记录 | 应有约 553 条 | ✅ 预期通过 |
| M02 | 竞争性磋商 | `purchaseManner=4&category=00101` | purchase_manner=4 | - | 待测 |
| M03 | 无效值 | `purchaseManner=99&category=00101` | total=0 | - | 待测 |
| M04 | 空 | 不传 | 不过滤 | - | 待测 |

**注意**：FilterSheet METHOD_OPTIONS 与 index METHOD_LABELS 映射不一致，需核对 dict_purchase_manner。

### 3.8 purchaser

| 用例 ID | 描述 | 请求 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|------|
| U01 | 采购人关键词 | `purchaser=成都&category=59&page=1&pageSize=10` | purchaser LIKE %成都% | **total=352**（实测） | ✅ 通过 |
| U02 | 部分匹配 | `purchaser=教育局&category=00101` | 采购人含「教育局」 | - | 待测 |
| U03 | 无匹配 | `purchaser=不存在的单位xyz&category=00101` | total=0 | - | 待测 |
| U04 | 空 | 不传 | 不过滤 | - | 待测 |

---

## 四、组合筛选测试用例

| 用例 ID | 描述 | 请求 | 预期 | 状态 |
|---------|------|------|------|------|
| CO01 | category + keyword | `category=00101&keyword=建设&page=1&pageSize=10` | 采购公告且含「建设」 | 待测 |
| CO02 | category + time | `category=59&timeStart=2026-03-10 00:00:00&timeEnd=2026-03-14 23:59:59` | 采购意向 + 时间范围 | 待测 |
| CO03 | category + purchaseManner | `category=00101&purchaseManner=1` | 采购公告 + 公开招标 | 待测 |
| CO04 | category + purchaser | `category=59&purchaser=成都` | 采购意向 + 采购人 | 待测 |
| CO05 | 全筛选（不含 region/source） | `category=00101&keyword=项目&timeStart=2026-03-01 00:00:00&timeEnd=2026-03-14 23:59:59&purchaseManner=1&purchaser=局&page=1&pageSize=10` | 各条件 AND 组合 | 待测 |
| CO06 | region + source | `regionCode=510100&source=510100&category=00101` | 成都地区记录 | **total=284** | ✅ 通过 |

---

## 五、边界与异常用例

| 用例 ID | 描述 | 请求 | 预期 | 状态 |
|---------|------|------|------|------|
| E01 | page=0 | `page=0&pageSize=10&category=00101` | 400 或按 1 处理 | 待测 |
| E02 | pageSize=0 | `page=1&pageSize=0&category=00101` | 400 或拒绝 | 待测 |
| E03 | pageSize>100 | `page=1&pageSize=200&category=00101` | 后端限制 le=100，应拒绝或截断 | 待测 |
| E04 | 时间格式错误 | `timeStart=invalid&category=00101` | 不报 500，优雅降级 | 待测 |
| E05 | SQL 注入尝试 | `keyword='; DROP TABLE notices;--` | 安全，不执行 | 待测 |
| E06 | 超长 keyword | `keyword=<1000 字符>` | 不报错 | 待测 |

---

## 六、问题汇总（待解决方案设计）

| 问题 ID | 描述 | 影响 | 根因 |
|---------|------|------|------|
| **P1** | regionCode 筛选无效 | 用户选「成都市」等地区时恒为 0 条 | 前端传 510100，后端精确匹配；site2 存 510101 等，site1 存 S001 等 |
| **P2** | source 筛选无效 | 用户选「交易来源」时恒为 0 条 | 同上；site2 不填 tradingsourcevalue |
| **P3** | 编码体系不统一 | region/source 无法跨 site 筛选 | site1 用 S001/S020，site2 用 510101，前端用 510100 |
| **P4** | METHOD_LABELS 与 FilterSheet 不一致 | 展示可能错乱 | index METHOD_LABELS 中 4=单一来源、6=竞争性磋商；FilterSheet 4=竞争性磋商、6=询价 |
| **P5** | category 非必填时行为未定义 | 不传 category 可能全表扫描 | 接口文档写必填，后端 Optional |
| **P6** | keyword 含 % _ 未转义 | 可能影响 LIKE 行为 | 需验证 |

---

## 七、执行说明

1. **前置**：启动 `uv run fastapi dev server/main.py`，确保 `data/notices.db` 有数据。
2. **执行**：用 curl 或 pytest 调用 `GET http://localhost:8000/api/list?<params>`。
3. **断言**：检查 `code=200`、`data.total`、`data.list` 长度及内容是否符合预期。
4. **记录**：将「实际」列和「状态」列更新为实测结果。
5. **问题**：将新发现问题加入第六节，并关联到具体用例。

---

## 八、后续步骤

1. 运行上述用例，填满「实际」「状态」列。
2. 根据问题汇总（第六节）设计解决方案（如 region 前缀匹配、编码映射表等）。
3. 将解决方案写入 design/proposal，再实现并回归测试。
