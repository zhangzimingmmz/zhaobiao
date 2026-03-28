## 1. Site1 采集分类扩展

- [x] 1.1 在 `crawler/site1/config.py` 中新增 `002001010` 的分类配置与名称，纳入 `ALL_CATEGORY_IDS`
- [x] 1.2 确认 `crawler/site1/tasks/backfill.py`、`incremental.py`、`recovery.py` 对新增分类自动生效，并补充必要注释或帮助文案
- [x] 1.3 如 `detail_backfill` 或其他 site1 运维脚本依赖默认分类顺序，同步补入 `002001010`

## 2. 后端分类映射与字典补齐

- [x] 2.1 在 `server/main.py` 中补充 `002001010 -> 招标文件预公示` 的分类名称映射
- [x] 2.2 通过 migration 或幂等补数逻辑向 `dict_notice_category` 增加 `002001010`
- [x] 2.3 检查 `/api/list`、详情接口和字典接口对新增分类的返回值是否一致

## 3. 前端分类契约收口

- [x] 3.1 检查工程建设频道、收藏归类和筛选模式中与 `002001010` 相关的分类归属是否完整
- [x] 3.2 确认空态、标签和分类名称与后端返回保持一致，不再出现“前端有页签但后端无定义”

## 4. 验证与回填

- [x] 4.1 在本地或测试库执行受控窗口的 site1 抓取，验证 notices 表中出现 `category_num='002001010'`
- [x] 4.2 检查 `dict_notice_category`、`/api/list?category=002001010` 和工程建设频道页面是否能返回数据
- [x] 4.3 评估是否需要执行历史回填，并记录推荐的 backfill 命令与风险提示
