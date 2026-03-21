## Why

网站一当前只采集全文检索列表接口，落库的 `content` 是列表层的压平文本，而不是详情页中已经嵌入的完整正文 HTML。工程建设尤其是招标计划类公告在原站详情中本来包含表格和结构化字段，但进入系统后已经丢失结构，导致后端正文格式化只能做文本补救，效果上限很低。

## What Changes

- 为 `site1_sc_ggzyjy` 增加详情页抓取能力，从详情 HTML 中提取 `newsText`、`originurl`、关联编号等详情字段。
- 将列表记录与详情记录合并落库，`notices.content` 改为优先保存详情层 HTML 正文，`raw_json` 改为保留列表与详情的组合原始数据。
- 为 `site1` 提供可回放的详情回填流程，用于补齐历史工程建设与政府采购公告的详情正文。
- 调整详情读取与正文渲染逻辑：当 `site1` 记录存在详情 HTML 时，优先走 HTML 清洗与统一样式；仅在缺少详情时回退到列表文本分段策略。

## Capabilities

### New Capabilities
- `site1-detail-ingestion`: 定义网站一详情页的抓取、合并落库与历史回填能力。

### Modified Capabilities
- `site1-crawler`: 网站一采集从“仅列表落库”扩展为“列表 + 详情合并落库”。
- `crawler-storage-schema`: 统一公告存储需要支持列表层与详情层组合原始数据，以及以详情正文覆盖展示正文。
- `notices-api`: 网站一详情接口返回的 `content` 与 `originUrl` 需要优先使用详情层数据。

## Impact

- 影响代码：`crawler/site1/*`、`crawler/storage.py`、`server/main.py`、`server/notice_body_rendering.py`、相关测试。
- 影响数据：`notices.content`、`notices.origin_url`、`notices.raw_json` 的 `site1` 写入策略发生变化，且需要历史回填。
- 影响运行：site1 增量、回填、补偿任务将新增详情请求，采集耗时与失败重试链路需要重新验证。
