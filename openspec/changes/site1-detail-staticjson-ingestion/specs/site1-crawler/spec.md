# site1-crawler Specification Delta

## MODIFIED Requirements

### Requirement: 爬虫可分页拉取列表并落库

系统 SHALL 提供 client.fetch_page(category_id, start_time, end_time, pn, rn)，返回 { totalcount, records }。对于 `site1_sc_ggzyjy` 白名单分类，爬虫 MUST 在列表落库后补抓详情页 HTML，并将列表层与详情层合并后通过 crawler.storage.upsert_records 写入 notices 表。

#### Scenario: 分页拉取并补抓详情后落库

- **WHEN** 对某 category 与时间窗口执行 fetch_page
- **THEN** 对每条 record 尝试获取对应详情，并将合并结果写入 notices 表

#### Scenario: 详情请求失败时仍保留列表记录

- **WHEN** 某条 record 的详情页请求失败
- **THEN** 列表记录仍被写入 notices，且后续任务可继续补抓详情

### Requirement: 爬虫支持 incremental 增量任务

系统 SHALL 提供 incremental 任务：用 previous_two_hour_window(now) 得到窗口，对三类分别分页拉取列表；对每条记录，任务 SHALL 尝试获取详情页后再落库。

#### Scenario: 增量任务写入详情正文

- **WHEN** 执行 incremental 且站点详情可用
- **THEN** 新写入或更新的 notices 记录包含详情层正文与原文链接

### Requirement: 爬虫支持 recovery 补偿任务

系统 SHALL 提供 recovery 任务：用 last_48h_windows(now) 得到窗口序列，对每个窗口、每个 category 执行与 incremental 相同的列表+详情补抓逻辑；此外系统 SHALL 提供独立的详情回填任务，用于针对历史 site1 记录补抓详情而不重跑列表。

#### Scenario: recovery 可补齐近 48 小时详情

- **WHEN** 执行 recovery
- **THEN** 最近 48 小时内的 site1 记录在保留列表去重语义的同时补齐可获取的详情层数据
