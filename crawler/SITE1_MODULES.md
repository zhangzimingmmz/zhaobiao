# 网站一（SITE1）爬虫 — 可执行模块拆分

本文档将 SITE1 采集逻辑拆成多个可执行模块，便于按依赖顺序逐个实现与联调。

---

## 1. 模块总览与依赖关系

```
                    ┌─────────────────┐
                    │  config         │  配置与常量（无依赖）
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  client         │  单次接口请求（依赖 config）
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  windowing    │   │  storage      │   │  (可选)       │
│  时间窗口计算  │   │  去重 + 落库   │   │  failure_q   │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  backfill     │   │  incremental  │   │  recovery     │
│  初始化任务   │   │  增量任务     │   │  补偿任务     │
└───────────────┘   └───────────────┘   └───────────────┘
```

**建议实现顺序**：config → client → storage → windowing → backfill → incremental → recovery（failure_q 可在 storage 或 incremental 阶段再接）。

---

## 2. 模块定义（按实现顺序）

### 模块 1：`config` — 配置与常量

| 项 | 说明 |
|----|------|
| **职责** | 集中存放站点常量、请求模板、分类与 condition、调度与阈值参数。 |
| **输入** | 无（或从环境变量/配置文件读取少量覆盖项）。 |
| **输出** | 被其他模块 import 的常量与配置对象。 |
| **依赖** | 无。 |

**建议提供内容**：

- 主接口 URL、请求头模板。
- 三类业务的 `categorynum` 与对应 `condition` 列表（可直接从 SITE1_CRAWLER_LOGIC 拷贝）。
- 通用请求 body 模板（含 `pn`、`rn`、`condition`、`time` 等占位）。
- 分页参数：`rn = 12`。
- 窗口与阈值：安全条数阈值（如 360）、初始日窗口、增量 2 小时、补偿 48 小时。
- 调度：增量 cron 表达式或间隔、补偿触发方式。
- 站点标识：`site = site1_sc_ggzyjy`。
- 重试：次数（如 3）、退避基数。

**可执行验收**：其他模块能 `from ...config import ...` 且不写死 URL/condition。

---

### 模块 2：`client` — 主接口请求

| 项 | 说明 |
|----|------|
| **职责** | 根据 config 构造请求体，发送 POST，解析 JSON，返回结构化结果；含重试与超时。 |
| **输入** | 分类标识、时间窗口 `(start_time, end_time)`、分页偏移 `pn`（及可选 `rn`）。 |
| **输出** | `{ "totalcount": int, "records": list[dict] }` 或明确失败（异常/Result 类型）。 |
| **依赖** | config。 |

**建议提供接口**：

- `probe_total(category_id, start_time, end_time) -> int`  
  探测请求：pn=0, rn=1，只返回 `totalcount`。
- `fetch_page(category_id, start_time, end_time, pn, rn=12) -> { totalcount, records }`  
  正式分页请求；内部完成 condition 组装、time 填充、重试与超时。

**可执行验收**：对任一类、给一个已知存在数据的时间窗口，能拿到 `totalcount` 和首页 `records`。

---

### 模块 3：`storage` — 去重与落库

| 项 | 说明 |
|----|------|
| **职责** | 以 `(site, id)` 为唯一键做 upsert；只写入文档中「建议保留字段」；维护 `first_seen_at` / `last_seen_at`。 |
| **输入** | 单条或批量 `records`（含接口返回的原始字段）+ `site`。 |
| **输出** | 写入条数/成功与否；可选返回「新增 vs 更新」统计。 |
| **依赖** | config（站点 ID、字段白名单）。 |

**建议提供接口**：

- `save_records(records: list[dict], site: str) -> { inserted, updated }`  
  内部做字段过滤、唯一键冲突处理、时间戳更新。

**可执行验收**：同一批记录写两次，第二次应为更新而非重复行；唯一键冲突时只更新 `last_seen_at` 等约定字段。

---

### 模块 4：`windowing` — 时间窗口计算

| 项 | 说明 |
|----|------|
| **职责** | 按文档规则生成「可抓取」的时间窗口序列，供 backfill / incremental / recovery 使用。 |
| **输入** | 模式（init / incremental / recovery）+ 时间范围或当前时间。 |
| **输出** | `list[(start_time, end_time)]`，左闭右闭或与接口约定一致。 |
| **依赖** | config（窗口粒度、补偿 48h 等）。 |

**建议提供接口**：

- `daily_windows(start_date, end_date) -> [(s, e), ...]`  
  按天切片，用于初始化。
- `split_window_to_smaller(start_time, end_time) -> [(s, e), ...]`  
  将一个大窗口拆成半天或小时（用于超阈值时）。
- `previous_two_hour_window(now) -> (start, end)`  
  当前时间「上一个完整 2 小时」窗口，用于增量。
- `last_48h_windows(now) -> [(s, e), ...]`  
  最近 48 小时的窗口序列（可按 2 小时一段输出），用于补偿。

**可执行验收**：给定 `now`，`previous_two_hour_window` 与文档示例一致；给定起止日期，`daily_windows` 覆盖且不重叠。

---

### 模块 5：`backfill` — 初始化任务

| 项 | 说明 |
|----|------|
| **职责** | 按「分类 × 时间窗口」执行初始化：探测 → 超阈值则拆窗 → 否则分页拉取并落库。 |
| **输入** | 初始化起点时间、终点时间（或「到现在」）；可选：仅指定分类。 |
| **输出** | 各窗口/分类的抓取条数或失败信息；可写日志或简单报表。 |
| **依赖** | config, client, storage, windowing。 |

**流程（与文档一致）**：

1. 对每个分类，用 `daily_windows` 生成日窗口。
2. 对每个窗口：`client.probe_total` → 若 0 则跳过；若 > 360 则 `split_window_to_smaller` 递归；否则 `pn=0` 循环 `fetch_page` 直到无数据或 `pn >= totalcount`，每页 `storage.save_records`。

**可执行验收**：指定一个短时间范围（如 1 天）和一类，能完整跑通且落库条数与接口 total 一致（或符合预期）。

---

### 模块 6：`incremental` — 增量任务

| 项 | 说明 |
|----|------|
| **职责** | 每 2 小时跑一次，抓「上一个完整 2 小时」窗口，三类分别拉取并落库。 |
| **输入** | 当前时间（或由调度器注入）。 |
| **输出** | 本次各分类抓取条数；失败时可写失败队列或打点。 |
| **依赖** | config, client, storage, windowing。 |

**流程**：

1. `windowing.previous_two_hour_window(now)` 得到 (start, end)。
2. 对每个分类：可选先 probe；若量小则直接分页抓取并 `save_records`；若单窗口超阈值则用 `split_window_to_smaller` 再抓。

**可执行验收**：手动传入一个「上一 2 小时」已过去的 now，能跑出对应窗口的三类数据并落库。

---

### 模块 7：`recovery` — 补偿任务

| 项 | 说明 |
|----|------|
| **职责** | 每天一次（或按配置），回抓最近 48 小时，与增量共用 client + storage + windowing 逻辑，依赖 `(site, id)` 去重。 |
| **输入** | 当前时间；可选：仅指定分类或时间范围上限。 |
| **输出** | 各窗口/分类抓取与更新条数。 |
| **依赖** | config, client, storage, windowing（与 incremental 相同，仅窗口来源不同）。 |

**流程**：用 `last_48h_windows(now)` 得到窗口列表，对每个窗口、每个分类执行与 incremental 相同的「分页 + 落库」；storage 侧已去重，无需额外逻辑。

**可执行验收**：跑一次 48 小时补偿，再跑一次，第二次应主要为更新、无重复主键。

---

### 模块 8（可选）：`failure_q` — 失败队列

| 项 | 说明 |
|----|------|
| **职责** | 记录某窗口/某页抓取失败，供补偿或人工重跑；可选消费接口「按窗口重试」。 |
| **输入** | 失败上下文：分类、窗口 (start, end)、pn、错误信息。 |
| **输出** | 写入队列；可选：读取待重试列表。 |
| **依赖** | config（队列路径或 Redis 等）。 |

可放在 storage 或单独小模块；第一版可先打日志，后续再落库/队列。

---

## 3. 目录与入口建议

```
crawler/
  site1/
    __init__.py
    config.py       # 模块 1
    client.py       # 模块 2
    storage.py      # 模块 3
    windowing.py    # 模块 4
    tasks/
      __init__.py
      backfill.py   # 模块 5
      incremental.py # 模块 6
      recovery.py   # 模块 7
  # 可选
  # site1/failure_q.py 或 在 storage 中简单实现
```

- **CLI 或入口**：可在 `site1/tasks/` 下各有一个 `__main__` 或统一用 `python -m crawler.site1.tasks.backfill --start 2026-03-01 --end 2026-03-02` 等形式，便于单模块验收和 cron 调用。

---

## 4. 小结：可执行顺序

| 顺序 | 模块 | 验收方式 |
|------|------|----------|
| 1 | config | 被引用、无硬编码 |
| 2 | client | 任一类、一窗口，能拿到 total + records |
| 3 | storage | 重复写入为更新、唯一键正确 |
| 4 | windowing | 日窗口 / 上一 2h / 48h 窗口符合文档 |
| 5 | backfill | 指定 1 天 1 类，完整跑通并落库 |
| 6 | incremental | 指定 now，上一 2h 窗口三类落库 |
| 7 | recovery | 48h 回抓，去重与更新正确 |
| 8（可选） | failure_q | 失败可记录、可重试 |

如果你认可这个拆分，我们可以从**模块 1（config）**开始，下一步就具体写出 `config.py` 的字段和默认值；你也可以先指定想先实现或想改动的模块（例如先做 client 再补 config），我们再按你的顺序来。
