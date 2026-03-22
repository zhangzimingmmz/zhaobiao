## 1. 保留策略脚本

- [x] 1.1 新增 notices retention CLI，支持 `--days`、`--dry-run`、`--apply` 等参数。
- [x] 1.2 dry-run 输出待删 notices / favorites 数量、按站点与分类分布、时间范围等统计信息。
- [x] 1.3 apply 时按“先删 bid favorites，再删 notices”的顺序执行，并输出最终删除结果。

## 2. 调度与运行约束

- [x] 2.1 将 retention 纳入 scheduler 低峰期任务，不暴露给运营后台直接触发。
- [x] 2.2 为首次生产执行补充备份与回滚步骤，明确 `DELETE` 与 `VACUUM` 的执行边界。

## 3. 测试与文档

- [x] 3.1 增加测试，覆盖 dry-run 不写库、30 天阈值命中、favorites 联动清理。
- [x] 3.2 更新运维与 API 文档，说明 notices 仅保留最近 30 天、历史 bid favorites 会随 notices 一起清理。
