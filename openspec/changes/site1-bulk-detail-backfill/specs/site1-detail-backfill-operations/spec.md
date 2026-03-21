# site1-detail-backfill-operations Specification

## ADDED Requirements

### Requirement: 网站一历史详情回填按固定分类顺序执行

系统 SHALL 为 `site1_sc_ggzyjy` 提供历史详情批量回填入口；当未显式指定分类时，默认执行顺序 MUST 为 `002001009 -> 002001001 -> 002002001`。

#### Scenario: 默认顺序优先处理工程建设

- **WHEN** 运行详情批量回填任务且未传 `--category`
- **THEN** 任务先处理 `002001009`，再处理 `002001001`，最后处理 `002002001`

### Requirement: 批量回填只补齐缺少 `_detail` 的记录

批量回填任务 SHALL 仅选择 `raw_json` 尚未包含 `_detail` 且 `linkurl` 可用的 `site1` 记录作为候选。

#### Scenario: 已补详情的记录被跳过

- **WHEN** notices 中某条 `site1` 记录的 `raw_json` 已包含 `_detail`
- **THEN** 批量回填不会再次抓取该条详情页

### Requirement: 批量回填支持分批、限速与 dry-run

批量回填任务 SHALL 支持批次大小、请求间隔与 dry-run 模式；dry-run MUST 执行抓取与统计，但 MUST NOT 写回数据库。

#### Scenario: dry-run 不写库

- **WHEN** 以 `--dry-run` 运行批量回填
- **THEN** notices 表中原记录内容保持不变，但日志或统计中能看到 attempted / succeeded / failed

### Requirement: 批量回填对单条失败具备容错能力

批量回填任务 SHALL 在单条详情抓取失败时记录日志并继续执行同批其他记录；当某分类失败数达到显式传入的阈值时，可停止该分类后续处理。

#### Scenario: 单条失败不中断整批

- **WHEN** 某条详情抓取返回异常
- **THEN** 任务记录 warning，并继续处理同分类剩余记录
