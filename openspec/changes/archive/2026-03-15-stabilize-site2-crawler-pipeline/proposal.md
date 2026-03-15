## Why

网站二爬虫已经证明签名、验证码、代理和落库链路可以打通，但当前结果仍混有测试数据、类型缺失和任务链路不一致的问题，尚不足以支撑正式初始化和长期增量运行。现在需要把 site2 从“可试跑”提升为“可重复执行、可恢复、可对账”的稳定采集流程，保证手动重跑和定时任务都能通过幂等写入收敛到唯一结果，并尽量避免遗漏。

## What Changes

- 清理 site2 历史测试数据的处理方式，并定义正式初始化流程：从 `2026-03-01` 回填到当前时间，覆盖 `59` 和 `00101` 两类数据
- 修正 site2 的 `backfill`、`incremental`、`recovery` 三类任务，使其共享一致的窗口处理、会话重建、分页抓取和落库行为
- 明确定义幂等写入要求：同一 `(site, id)` 在重复手动执行、重复增量、补偿回扫时始终收敛为单条最终记录，不产生重复脏数据
- 为增量任务增加“防遗漏”策略，包括安全回扫窗口、失败后的补偿路径和日级/窗口级对账能力
- 增加可验证的稳定性标准，覆盖源站总量对账、重复运行一致性、故障恢复和字段完整性检查

## Capabilities

### New Capabilities
- `site2-crawler-stability`: 定义 site2 爬虫正式初始化、幂等增量、补偿回扫、对账验证和测试数据清理的行为要求

### Modified Capabilities

## Impact

- 影响代码：`crawler/site2/` 下的 `client.py`、`session.py`、`tasks/backfill.py`、`tasks/incremental.py`、`tasks/recovery.py`，以及可能新增的运行/校验辅助模块
- 影响数据：`data/notices.db` 中 `site='site2_ccgp_sichuan'` 的历史测试数据清理与正式重建
- 影响运行方式：site2 将从手工试跑升级为“初始化 backfill + 每 2 小时 incremental + 最近 48 小时 recovery + 对账验证”的正式链路
- 无新增外部 API；继续复用现有 `notices` 表和服务端读取逻辑
