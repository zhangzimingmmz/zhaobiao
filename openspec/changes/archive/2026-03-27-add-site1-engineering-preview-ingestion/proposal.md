## Why

工程建设频道已经在小程序中新增了“招标文件预公示”页签，但当前采集链路、分类字典和后端分类映射都没有接入对应分类，导致前端传入新分类后只能查询到空结果。需要补齐从 site1 采集到 notices API 的端到端支持，避免前端入口与实际数据能力脱节。

## What Changes

- 将 site1 工程建设采集范围从现有三类扩展为四类，新增“招标文件预公示”分类的配置、窗口遍历和落库支持。
- 为统一公告分类映射补充 `002001010`，使列表、详情和字典接口能够返回正确的 `categoryName`。
- 校准工程建设频道与 `/api/list` 的契约，使“招标文件预公示”分类可以被精确查询并在前端正常展示。
- 补充回填与增量验证要求，确保该新增分类不仅有前端入口，而且能被例行任务持续采集。

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `site1-crawler`: 采集配置与任务范围从三类公告扩展到包含 `002001010` 的四类工程建设/采购公告类型。
- `notices-api`: 列表与详情接口支持 `002001010` 分类的查询、命名和返回契约。

## Impact

- Affected code: `crawler/site1/config.py`, `crawler/site1/tasks/*.py`, `crawler/migrations/*.sql`, `server/main.py`, `miniapp/src/pages/construction/index.tsx`
- Affected systems: site1 采集任务、SQLite 分类字典、公告列表/详情接口、工程建设频道展示
- Verification: 需要通过增量/回填任务与数据库分类分布检查确认 `002001010` 真实落库
