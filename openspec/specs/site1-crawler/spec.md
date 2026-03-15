# Spec: site1-crawler

## ADDED Requirements

### Requirement: 爬虫可配置三类公告的采集参数

系统 SHALL 提供 config 模块，集中存放网站一主接口 URL、请求头模板、三类业务的 categorynum 与 condition、分页参数 rn、时间窗口阈值（如 360 条）、站点标识 site1_sc_ggzyjy、重试次数与退避基数。其他模块 MUST 通过 import config 获取上述常量，不得硬编码。

#### Scenario: 其他模块引用 config

- **WHEN** client 或 windowing 模块需要主接口 URL 或 condition
- **THEN** 从 config 导入并使用，无硬编码 URL 或 condition 字符串

### Requirement: 爬虫可探测单窗口总条数

系统 SHALL 提供 client.probe_total(category_id, start_time, end_time)，发送 pn=0、rn=1 的探测请求，返回 result.totalcount。请求体 MUST 按《原始数据接口文档》1.1.3 组装 condition 与 time。

#### Scenario: 探测空窗口返回 0

- **WHEN** 调用 probe_total 且该时间窗口无数据
- **THEN** 返回 0

#### Scenario: 探测有数据窗口返回总数

- **WHEN** 调用 probe_total 且该时间窗口有数据
- **THEN** 返回 result.totalcount 正整数

### Requirement: 爬虫可分页拉取列表并落库

系统 SHALL 提供 client.fetch_page(category_id, start_time, end_time, pn, rn)，返回 { totalcount, records }。爬虫 MUST 将 records 通过 crawler.storage.upsert_records 写入 notices 表，site 为 site1_sc_ggzyjy，字段与《原始数据接口文档》1.1.5 落库建议一致。

#### Scenario: 分页拉取并落库

- **WHEN** 对某 category 与时间窗口执行 fetch_page 并调用 upsert_records
- **THEN** notices 表中存在对应 (site, id) 记录，且 publish_time、title、source_name 等字段正确

#### Scenario: 重复写入为更新

- **WHEN** 同一批 records 写入两次
- **THEN** 第二次为更新而非重复行，last_seen_at 更新

### Requirement: 爬虫可生成时间窗口序列

系统 SHALL 提供 windowing 模块：daily_windows(start_date, end_date) 按天切片；previous_two_hour_window(now) 返回上一完整 2 小时窗口；last_48h_windows(now) 返回最近 48 小时窗口序列；split_window_to_smaller(start, end) 在单窗口超阈值时拆成更小窗口。

#### Scenario: 上一 2 小时窗口正确

- **WHEN** now 为 14:05，调用 previous_two_hour_window(now)
- **THEN** 返回 (12:00:00, 13:59:59)

#### Scenario: 日窗口覆盖且不重叠

- **WHEN** 调用 daily_windows(2026-03-01, 2026-03-03)
- **THEN** 返回 3 个窗口，覆盖 3 天且不重叠

### Requirement: 爬虫支持 backfill 初始化任务

系统 SHALL 提供 backfill 任务：对每个 category（002001009、002001001、002002001），用 daily_windows 生成日窗口；对每个窗口 probe_total，若 0 则跳过，若 > 360 则 split_window_to_smaller 递归；否则分页拉取并落库直到 pn >= totalcount。

#### Scenario: 指定 1 天 1 类可完整跑通

- **WHEN** 执行 backfill --start 2026-03-14 --end 2026-03-14 --category 002001009
- **THEN** 该日该类的数据完整落库，条数与接口 totalcount 一致

### Requirement: 爬虫支持 incremental 增量任务

系统 SHALL 提供 incremental 任务：用 previous_two_hour_window(now) 得到窗口，对三类分别分页拉取并落库。

#### Scenario: 指定 now 可抓取上一 2h 窗口

- **WHEN** 执行 incremental，传入已过去的「上一 2 小时」的 now
- **THEN** 该窗口的三类数据落库

### Requirement: 爬虫支持 recovery 补偿任务

系统 SHALL 提供 recovery 任务：用 last_48h_windows(now) 得到窗口序列，对每个窗口、每个 category 执行与 incremental 相同的分页与落库；storage 侧 (site, id) 去重，重复跑主要为更新。

#### Scenario: 48h 补偿去重正确

- **WHEN** 执行 recovery 两次
- **THEN** 第二次主要为更新，无重复主键
