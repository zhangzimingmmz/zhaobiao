# Spec: admin-crawl-run-control

## ADDED Requirements

### Requirement: 管理员 SHALL 只能请求受支持的手工采集动作
控制面 SHALL 只允许管理员请求白名单中的手工采集动作，并对每种动作执行参数校验和权限边界检查；不在白名单中的动作 MUST 被拒绝。

#### Scenario: 请求受支持的例行重跑
- **WHEN** 管理员在后台请求某站点的 `incremental` 或 `recovery`
- **THEN** 系统接受该请求并创建一条新的手工运行记录

#### Scenario: 请求不受支持的高风险动作
- **WHEN** 管理员尝试请求 `cleanup`、`backfill --formal` 或其他未被允许的动作
- **THEN** 系统拒绝该请求，并返回明确的拒绝原因

### Requirement: 手工 backfill SHALL 受到参数边界约束
控制面对 `backfill` 请求 SHALL 要求显式参数，并对时间范围和可选维度施加安全边界；超出边界的请求 MUST 被拒绝，而不是被静默放大。

#### Scenario: 请求受限窗口 backfill
- **WHEN** 管理员提交一个落在允许范围内的 `backfill` 时间窗口
- **THEN** 系统接受该请求并记录请求参数

#### Scenario: 请求超出安全上限的 backfill
- **WHEN** 管理员提交超出允许时间范围上限的 `backfill`
- **THEN** 系统拒绝该请求，并提示其超出控制面允许的窗口范围

### Requirement: 后台 SHALL 展示手工请求的受理状态与拒绝原因
后台 SHALL 为每个手工请求展示 `queued`、`running`、`succeeded`、`failed` 或 `rejected` 等状态，并在请求被拒绝时展示可读原因。

#### Scenario: 查看已受理请求状态
- **WHEN** 管理员提交一个合法的手工请求
- **THEN** 后台展示该请求的 run id 和当前状态，并允许后续轮询查看结果

#### Scenario: 查看请求被拒绝原因
- **WHEN** 某个手工请求因参数无效、动作不允许或锁冲突而被拒绝
- **THEN** 后台展示明确的拒绝原因，而不是只返回通用失败提示
