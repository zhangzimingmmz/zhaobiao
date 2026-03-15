## ADDED Requirements

### Requirement: 系统 SHALL 持久化结构化采集运行快照
系统 SHALL 为受支持的 crawler 任务入口持久化结构化运行快照，至少记录 `site`、`taskName`、`runKind`、`triggerSource`、`status`、`startedAt`、`finishedAt`、计数信息和摘要信息。

#### Scenario: 例行任务执行成功
- **WHEN** 某个 site1 或 site2 的例行任务完成执行
- **THEN** 系统写入一条成功的运行快照，包含该次任务的开始时间、结束时间、结果计数和摘要

#### Scenario: 任务执行失败
- **WHEN** 某个受支持任务在执行过程中抛出异常或失败退出
- **THEN** 系统仍写入一条失败的运行快照，包含失败状态和可读摘要

### Requirement: 采集运维后台 SHALL 提供按任务维度过滤的运行历史
后台 SHALL 提供运行历史列表，用于查看 routine、maintenance、diagnostic 三类任务的最近执行记录，并支持按站点、任务、状态和触发来源筛选。

#### Scenario: 查看站点运行历史
- **WHEN** 运营人员筛选某个站点或任务类型
- **THEN** 系统展示对应运行历史，至少包含任务名称、运行类别、触发来源、执行状态、执行时间和结果摘要

#### Scenario: 查看维护任务历史
- **WHEN** 运营人员查看 `backfill`、`cleanup` 或 `reconcile` 等维护/诊断任务
- **THEN** 系统以历史记录的形式展示这些执行结果，而不是把它们与例行增量健康度混为一类

### Requirement: 维护与诊断任务 SHALL 以只读历史呈现
后台 SHALL 将 `backfill`、`precheck`、`cleanup`、`reconcile` 等高风险或低频任务作为只读历史与详情呈现；本 change 不提供从后台直接触发这些任务的控制能力。

#### Scenario: 查看 diagnostic 运行详情
- **WHEN** 运营人员打开某次 `reconcile` 或 `precheck` 的运行记录
- **THEN** 系统展示该次运行的参数和结果摘要，但不提供“重新执行”或“立即触发”按钮
