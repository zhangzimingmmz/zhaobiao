## Why

当前产品只关注近几天到近 30 天内的最新公告，一个月以前的采集 notices 对业务几乎没有价值。继续长期保留历史 notices 会持续放大 SQLite 文件体积、全文模糊检索扫描成本和回填/备份成本，但不会带来对应的业务收益。

同时，当前收藏已经是账号级服务端关系；如果过期 notices 被删除，关联的 bid favorites 也应同步清理，避免数据库残留悬挂关系。

## What Changes

- 新增 notices 30 天保留策略：仅保留 `publish_time` 在近 30 天内的采集公告。
- 提供受控的 retention 清理脚本，支持 `--dry-run` 与正式执行两种模式。
- 清理 notices 时同步清理关联的 `bid` 类型 favorites，避免留下失效关系。
- 将 notices 清理纳入 scheduler/运维流程，但不开放给运营后台直接触发。
- 更新文档，明确“只保留最近 30 天 notices”是业务策略，而不是临时运维动作。

## Capabilities

### New Capabilities
- `notice-retention-policy`: 定义 notices 的 30 天保留规则、dry-run、删除顺序与调度约束。

### Modified Capabilities
- `notices-api`: 明确列表与详情接口只对当前仍在保留窗口内的 notices 提供查询结果。
- `favorites-api`: 明确当 bid notices 因 retention 被清理时，关联 favorites 应同步删除。

## Impact

- 影响代码：新增 retention 清理脚本与调度入口，可能涉及 scheduler 配置与运维脚本。
- 影响数据：30 天前的 notices 会被物理删除，且关联的 bid favorites 会一起删除。
- 影响运维：首次正式执行前需备份生产 `notices.db`，先做 dry-run 观测。
