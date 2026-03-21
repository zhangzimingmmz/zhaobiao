# site1-crawler Specification

## MODIFIED Requirements

### Requirement: 爬虫支持 backfill 初始化任务

系统 SHALL 提供 backfill 任务：对每个 category（002001009、002001001、002002001），用 daily_windows 生成日窗口；对每个窗口 probe_total，若 0 则跳过，若 > 360 则 split_window_to_smaller 递归；否则分页拉取并落库直到 pn >= totalcount。

此外，系统 SHALL 提供独立的 `detail_backfill` 历史详情回填任务，用于对已有 `site1` 记录补抓详情页并按 merge 方式写回 notices。该任务默认 MUST 按 `002001009 -> 002001001 -> 002002001` 顺序执行，并支持批次大小、请求间隔、失败阈值与 dry-run。

#### Scenario: 默认 detail_backfill 顺序正确

- **WHEN** 执行 `detail_backfill` 且未传分类参数
- **THEN** 任务依次处理 `002001009`、`002001001`、`002002001`
