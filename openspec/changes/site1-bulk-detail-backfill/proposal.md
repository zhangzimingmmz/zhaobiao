## Why

`site1` 的详情抓取与单条回填能力已经具备，但生产上仍缺少一个可安全执行的“三分类批量回填”方案。当前最乱的工程建设招标计划、招标公告，以及 `site1` 下的政府采购采购公告，历史记录大多仍只保存列表层压平 `content`，没有 `_detail` 详情数据。直接一次性全量跑现有脚本存在几个问题：默认不按业务优先级排序、缺少批次日志、没有明确的限速与失败阈值，也没有对应的运维执行说明。

## What Changes

- 为 `crawler/site1/tasks/detail_backfill.py` 增加面向生产批量执行的参数与统计能力，支持三分类顺序回填、分批写库、限速、失败阈值与 dry-run。
- 将默认执行顺序固定为 `002001009 -> 002001001 -> 002002001`，优先修复工程建设类历史详情。
- 补充测试，覆盖默认分类顺序、dry-run 不落库、分批回填统计等行为。
- 更新采集/运维文档，明确批量回填的推荐命令、分阶段策略与验收重点。

## Capabilities

### New Capabilities
- `site1-detail-backfill-operations`: 定义网站一历史详情批量回填的执行顺序、批次控制与观测要求。

### Modified Capabilities
- `site1-crawler`: 在已有详情抓取能力上补充历史批量回填的默认执行策略与安全约束。

## Impact

- 影响代码：`crawler/site1/tasks/detail_backfill.py`、相关测试。
- 影响运行：生产回填将从“一次性脚本”变成“可分批、可重跑、可观测”的任务。
- 影响文档：`crawler/SITE1_CRAWLER_LOGIC.md`、`docs/06-运维与FAQ.md` 等需写明正式执行方案。
