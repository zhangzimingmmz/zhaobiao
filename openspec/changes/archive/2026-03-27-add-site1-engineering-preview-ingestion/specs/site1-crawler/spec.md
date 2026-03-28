## MODIFIED Requirements

### Requirement: 爬虫可配置三类公告的采集参数

系统 SHALL 提供 config 模块，集中存放网站一主接口 URL、请求头模板、四类业务的 categorynum 与 condition、分页参数 rn、时间窗口阈值（如 360 条）、站点标识 site1_sc_ggzyjy、重试次数与退避基数。该四类业务 MUST 包含 `002001009`（招标计划）、`002001010`（招标文件预公示）、`002001001`（招标公告）和 `002002001`（政府采购采购公告）。其他模块 MUST 通过 import config 获取上述常量，不得硬编码。

#### Scenario: 其他模块引用 config

- **WHEN** client 或 windowing 模块需要主接口 URL 或 condition
- **THEN** 从 config 导入并使用，无硬编码 URL 或 condition 字符串

### Requirement: 爬虫支持 backfill 初始化任务

系统 SHALL 提供 backfill 任务：对每个 category（`002001009`、`002001010`、`002001001`、`002002001`），用 daily_windows 生成日窗口；对每个窗口 probe_total，若 0 则跳过，若 > 360 则 split_window_to_smaller 递归；否则分页拉取并落库直到 pn >= totalcount。

#### Scenario: 指定 1 天 1 类可完整跑通

- **WHEN** 执行 `backfill --start 2026-03-14 --end 2026-03-14 --category 002001010`
- **THEN** 该日该类的数据完整落库，条数与接口 totalcount 一致

### Requirement: 爬虫支持 incremental 增量任务

系统 SHALL 提供 incremental 任务：用 previous_two_hour_window(now) 得到窗口，对四类分别分页拉取并落库。

#### Scenario: 指定 now 可抓取上一 2h 窗口

- **WHEN** 执行 incremental，传入已过去的「上一 2 小时」的 now
- **THEN** 该窗口的四类数据落库

### Requirement: 爬虫支持 recovery 补偿任务

系统 SHALL 提供 recovery 任务：用 last_48h_windows(now) 得到窗口序列，对每个窗口、每个 category 执行与 incremental 相同的分页与落库；storage 侧 `(site, id)` 去重，重复跑主要为更新。

#### Scenario: 48h 补偿去重正确

- **WHEN** 执行 recovery 两次，且窗口内包含 `002001010` 数据
- **THEN** 第二次主要为更新，无重复主键
