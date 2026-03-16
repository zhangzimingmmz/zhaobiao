# 数据库精确真相

本目录为「数据库精确真相」的约定位置。

- **当前实现**：本仓库中，表结构演进由 **crawler/migrations/** 下的 SQL 文件定义，按文件名顺序执行后得到当前 schema。迁移在应用启动或部署时由 `crawler.storage.ensure_schema`（或同等逻辑）执行。
- **migrations 路径**：`crawler/migrations/`（如 `001_create_notices.sql`、`002_create_dict_tables.sql` 等）。
- **当前 schema**：无单独 `db/schema/` 快照时，以「从空库按序执行所有 migrations」后的结果为准；字段与约束以 migrations 及 `crawler/storage.py` 中使用的列为准。
- **给人看的文档**：见 [docs/05-数据库设计.md](../docs/05-数据库设计.md)；完整表与字段说明见 [docs/数据库表设计.md](../docs/数据库表设计.md)。
- **谁改**：改表结构的人修改 migrations 并同步更新上述文档。
- **Review**：必须；数据库变更需与代码同 PR review。
