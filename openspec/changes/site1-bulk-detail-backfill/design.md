## Overview

这次变更不新增新的抓取来源，也不改变详情解析规则，而是把已经存在的 `site1` 详情补抓能力整理成一个生产可执行的批量回填方案。重点是：

1. 默认只处理 `site1_sc_ggzyjy`；
2. 默认按 `002001009 -> 002001001 -> 002002001` 顺序回填；
3. 回填时只处理 `raw_json` 尚未包含 `_detail` 且 `linkurl` 可用的记录；
4. 单条失败不影响整批继续执行；
5. 所有写库使用 merge 模式，保持幂等。

## Execution Model

### Category ordering

默认分类顺序固定为：

1. `002001009` 招标计划
2. `002001001` 招标公告
3. `002002001` 政府采购采购公告

这个顺序不是实现细节，而是运维策略：最先修复当前前台可读性最差的工程建设内容，其次再处理 `site1` 下的政府采购。

### Candidate selection

批量回填候选记录满足：

- `site = site1_sc_ggzyjy`
- `linkurl` 非空
- `raw_json` 尚未包含 `_detail`

这样可以保证任务天然支持断点续跑：已经补过详情的记录会被跳过。

### Batch processing

回填按“分类 -> 批次 -> 单条详情抓取”的顺序执行：

```text
category A
  -> batch 1
  -> batch 2
category B
  -> batch 1
...
```

每条记录：

1. 用 `linkurl` 抓详情页；
2. 解析出详情字段；
3. 合并列表与详情 payload；
4. 批量 merge 写回 notices。

### Failure handling

- 单条详情抓取失败时，记录 warning 并继续下一条；
- 单个分类可设置 `max_failures`，达到阈值后停止该分类；
- dry-run 模式下允许抓取与统计，但不写库。

## CLI surface

`detail_backfill.py` 需要支持下列操作参数：

- `--category` 可重复传入多次，未传时按默认三分类顺序执行
- `--limit` 每个分类的最大处理条数
- `--batch-size` 每批写库条数
- `--sleep-seconds` 每条详情请求间隔
- `--max-failures` 单分类失败阈值
- `--dry-run` 只抓取与统计，不写库

## Observability

日志至少输出：

- 每个分类的候选数与已跳过数
- 每个批次的 attempted / succeeded / failed / saved
- 分类结束汇总
- 全任务汇总

这样即使回填在生产上跑很久，也能通过日志快速判断是否卡住或异常。

## Validation

验收重点不是“脚本跑完”，而是：

1. `002001009`、`002001001`、`002002001` 三类都能独立回填；
2. dry-run 不会写库；
3. 默认顺序符合预期；
4. 任务可多次重复执行，第二次主要表现为跳过已补 `_detail` 的记录。
