# Spec: site1-crawler

## ADDED Requirements

### Requirement: 配置集中管理

系统 SHALL 在单一配置模块中提供 SITE1 主接口 URL、请求头、三类业务的 categorynum 与 condition、通用请求体模板、分页参数 rn、安全条数阈值、站点标识、增量/补偿窗口与调度相关常量，且其他模块 SHALL 通过导入该配置使用，不得硬编码上述值。

#### Scenario: 配置被正确引用

- **WHEN** 任意爬虫模块（client、storage、windowing、tasks）需要 URL 或 condition
- **THEN** 该模块从 config 模块导入并使用，且无重复定义的 URL 或 condition 字面量

#### Scenario: 三类业务 condition 可用

- **WHEN** 调用方请求招标计划、招标公告或政府采购采购公告的 condition
- **THEN** 返回与 SITE1_CRAWLER_LOGIC 文档一致的 JSON 条件数组（含 categorynum 或 ZHUANZAI 等约定字段）

---

### Requirement: 主接口请求与重试

系统 SHALL 提供根据分类与时间窗口向 SITE1 主接口发起 POST 请求的能力，支持探测（仅取 totalcount）与分页拉取（返回 totalcount 与 records）；请求 SHALL 包含正确 condition 与 time 范围；失败时 SHALL 按配置进行有限次重试与指数退避。

#### Scenario: 探测返回总数

- **WHEN** 调用 probe_total(category_id, start_time, end_time)
- **THEN** 返回该窗口下该分类的 totalcount，且不依赖 records 内容

#### Scenario: 分页返回本页记录

- **WHEN** 调用 fetch_page(category_id, start_time, end_time, pn, rn)
- **THEN** 返回 { totalcount, records }，且 records 为当前页列表，条数不超过 rn

#### Scenario: 超时或 5xx 时重试

- **WHEN** 单次请求超时或服务端返回 5xx
- **THEN** 按配置重试次数与退避策略重试，超过次数后向上层返回失败

---

### Requirement: 去重与落库

系统 SHALL 以 (site, id) 为唯一键对公告记录做 upsert；仅持久化 SITE1_CRAWLER_LOGIC 中规定之保留字段及 first_seen_at、last_seen_at；同一 (site, id) 再次写入时 SHALL 更新 last_seen_at 及可更新字段，不产生重复行。

#### Scenario: 首次写入为插入

- **WHEN** save_records 收到一批未出现过的 (site, id) 记录
- **THEN** 写入新行并设置 first_seen_at 与 last_seen_at

#### Scenario: 重复写入为更新

- **WHEN** save_records 收到已存在的 (site, id)
- **THEN** 更新该行 last_seen_at 及接口返回的允许更新字段，不插入新行

---

### Requirement: 时间窗口生成

系统 SHALL 提供按日生成初始化窗口、按上一完整 2 小时生成增量窗口、以及最近 48 小时补偿窗口序列的能力；窗口边界 SHALL 与 SITE1 文档约定一致（如左闭右闭），且支持将大窗口拆分为更小窗口（半天或小时）以满足安全阈值。

#### Scenario: 日窗口覆盖起止日期

- **WHEN** 调用 daily_windows(start_date, end_date)
- **THEN** 返回的区间列表覆盖 [start_date, end_date]，按天划分且无重叠

#### Scenario: 上一 2 小时窗口正确

- **WHEN** 给定当前时间 now，调用 previous_two_hour_window(now)
- **THEN** 返回的 (start, end) 为「当前时刻之前的一个完整 2 小时」区间，与文档示例一致

#### Scenario: 补偿 48 小时窗口

- **WHEN** 调用 last_48h_windows(now)
- **THEN** 返回覆盖「当前时刻往前 48 小时」的窗口序列，可与增量逻辑复用

---

### Requirement: 初始化、增量与补偿任务

系统 SHALL 提供 backfill、incremental、recovery 三种任务入口；backfill SHALL 按分类与日窗口执行探测与拆窗后分页抓取并落库；incremental SHALL 每 2 小时抓取上一 2 小时窗口的三类数据；recovery SHALL 按配置回抓最近 48 小时并与增量共用落库逻辑；所有任务 SHALL 仅使用 SITE1 主接口与已实现的 client、storage、windowing。

#### Scenario: backfill 单窗口验收

- **WHEN** 对某一分类执行 backfill，时间范围为单日且该日数据量低于安全阈值
- **THEN** 该日该分类所有分页被拉取并落库，总条数与接口 totalcount 一致（或符合预期）

#### Scenario: incremental 抓取上一 2 小时

- **WHEN** 在某一时刻执行 incremental
- **THEN** 三类公告的「上一完整 2 小时」窗口被请求并落库，无遗漏分类

#### Scenario: recovery 去重

- **WHEN** 对同一 48 小时范围执行两次 recovery
- **THEN** 第二次执行不产生重复 (site, id)，仅更新 last_seen_at 等
