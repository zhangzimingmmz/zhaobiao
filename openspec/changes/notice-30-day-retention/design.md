## Overview

本变更把“只保留最近 30 天 notices”固化为正式的业务保留策略，而不是一次性的手工清库。策略只作用于采集公告 `notices`，不作用于 `users`、`enterprise_applications`、`articles`、`crawl_runs` 等其他表。

设计目标：

1. 只按 `publish_time` 判断 notices 是否过期；
2. 支持 `dry-run`，先统计候选，再决定是否正式删除；
3. 删除过期 notices 时同步删除关联的 `bid` favorites；
4. 默认通过 scheduler 在低峰期定时执行；
5. 不把 retention 暴露给运营后台手工触发。

## Scope

### Included

- `notices` 表中 `publish_time < now - 30 days` 的记录
- `user_favorites` 中指向上述 notices 的 `target_type='bid'` 关系
- retention dry-run / apply CLI
- scheduler 低峰期定时调用
- 运维文档与观察指标

### Excluded

- `articles` 表
- `users`、`enterprise_applications`
- `crawl_runs` 与其历史日志
- 运营后台直接触发 retention

## Retention Rule

以 notices 的 `publish_time` 作为唯一保留判断条件：

```text
publish_time < cutoff
```

其中 `cutoff = 当前日期时间 - 30 天`。

不按 `first_seen_at` 或 `last_seen_at` 做判断，因为：

- 回填或补抓会改变 `last_seen_at`
- 用户感知的“新旧”以公告发布时间为准

## Execution Model

### Dry-run

dry-run 模式只做统计，不落库，至少输出：

- 待删除 notices 数量
- 待删除 bid favorites 数量
- 按 `site` / `category_num` 的分布
- 最早、最晚被命中的 `publish_time`

### Apply

正式执行的删除顺序：

1. 找出过期 notices 的 `(site, id)` 集合
2. 删除 `user_favorites` 中对应的 `target_type='bid'` 关系
3. 删除过期 notices
4. 输出最终删除统计

这样可以避免残留悬挂 favorites。

## Scheduling

建议每日凌晨低峰期执行一次，例如 03:00。

初期可以采用：

```text
日常：先 dry-run 观测
确认后：切换为正式 apply
```

正式上线前，生产需先备份 `notices.db`。

## Storage Considerations

SQLite 在执行 `DELETE` 后不会立刻让数据库文件变小，只会释放空页供后续复用。因此：

- 日常 retention 只执行 `DELETE`
- `VACUUM` 不纳入每日任务
- 如需回收磁盘空间，可在低峰期按周或按月单独执行一次 `VACUUM`

## Safety Constraints

- retention MUST 支持 `--dry-run`
- retention MUST NOT 默认删除 `articles` 或其他业务表
- retention MUST NOT 通过 admin crawl control 直接暴露给后台
- 首次生产执行前 MUST 先备份数据库

## Validation

验收重点：

1. dry-run 统计准确且不写库
2. apply 后，30 天前 notices 被删除
3. 关联 bid favorites 被同步删除
4. 30 天内 notices 不受影响
5. 列表与详情接口对保留窗口内数据继续正常工作
