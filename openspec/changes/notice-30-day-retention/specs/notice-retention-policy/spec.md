# notice-retention-policy Specification

## ADDED Requirements

### Requirement: notices SHALL 只保留最近 30 天数据

系统 SHALL 以 `publish_time` 为基准，仅保留最近 30 天的 `notices` 记录；早于该窗口的 notices 属于 retention 候选。

#### Scenario: 30 天前 notices 成为候选

- **WHEN** 某条 notices 的 `publish_time` 早于当前时间 30 天以上
- **THEN** 该记录会被 retention 任务识别为删除候选

### Requirement: retention MUST 支持 dry-run

retention 任务 SHALL 支持 `dry-run`，在不写库的前提下输出待删除 notices 与 favorites 的统计信息。

#### Scenario: dry-run 只统计不删除

- **WHEN** 运维以 `--dry-run` 执行 retention
- **THEN** 系统输出候选数量和分布，但 notices 与 favorites 表数据保持不变

### Requirement: retention SHALL 同步清理关联 bid favorites

系统在删除过期 notices 时 SHALL 同步删除 `user_favorites` 中关联的 `target_type='bid'` 关系，避免悬挂记录。

#### Scenario: 过期公告被删除时收藏一并删除

- **WHEN** 某条过期 notices 被正式删除
- **THEN** 所有指向该 `(site, id)` 的 bid favorites 也被删除

### Requirement: retention SHALL 通过受控调度执行

retention 任务 SHALL 通过 scheduler 或受控 shell/运维流程执行，不得作为运营后台直接可点击的高风险动作暴露。

#### Scenario: retention 不在后台控制面开放

- **WHEN** 运营人员在后台查看可触发采集动作
- **THEN** 不会看到 retention 作为可直接触发的入口
