# site1-detail-ingestion Specification

## Purpose
定义网站一详情页的抓取、合并落库与历史回填能力，确保工程建设与政府采购公告可以保存原站详情 HTML 正文，而不是仅保留列表层压平文本。

## Requirements

### Requirement: 系统 SHALL 能为 site1 列表记录抓取详情页内容

对 `site1_sc_ggzyjy` 的白名单分类记录，系统 SHALL 能根据列表记录定位并请求对应详情页 HTML，解析页面中的正文 HTML、原文链接、关联编号与页面标题等字段。

#### Scenario: 招标计划记录可抓取详情

- **WHEN** 系统处理一条 `categorynum=002001009` 的 site1 列表记录
- **THEN** 能请求对应的详情页并解析出详情字段

#### Scenario: 招标公告记录可抓取详情

- **WHEN** 系统处理一条 `categorynum=002001001` 的 site1 列表记录
- **THEN** 能请求对应的详情页并解析出详情字段

### Requirement: site1 落库 SHALL 合并列表与详情原始数据

系统在保存 site1 记录时，`raw_json` SHALL 保留组合结构，至少包含 `_list` 与 `_detail` 两部分；当详情暂不可得时，仍 SHALL 保留 `_list`，并允许后续 merge 更新补入 `_detail`。

#### Scenario: 列表与详情同时存在

- **WHEN** 系统已成功获取某条记录的列表与详情数据
- **THEN** `raw_json` 包含 `_list` 与 `_detail`，且两部分都可追溯

#### Scenario: 仅有列表时允许后续补全

- **WHEN** 首次采集只拿到列表记录
- **THEN** 该记录仍可写入，并在后续 merge 更新时补入 `_detail`

### Requirement: site1 正文与原文链接 SHALL 优先来自详情层

当 site1 详情响应中存在 `infoContent` 或 `originurl` 时，系统 SHALL 用这些字段覆盖 notices 表对应记录的 `content` 与 `origin_url`；若详情缺失或字段为空，才回退到列表层的 `content` / `linkurl`。

#### Scenario: 详情正文覆盖列表正文

- **WHEN** 详情响应包含非空 `infoContent`
- **THEN** notices.content 保存该 HTML，而不是列表压平文本

#### Scenario: 详情原文链接覆盖站内 linkurl

- **WHEN** 详情响应包含非空 `originurl`
- **THEN** notices.origin_url 保存该值

### Requirement: 系统 SHALL 提供 site1 历史详情回填能力

系统 SHALL 提供独立任务，用于扫描已有的 site1 记录，针对尚未拥有详情层数据的记录补抓详情页并 merge 回 notices。

#### Scenario: 历史回填补齐详情

- **WHEN** 对已有 site1 记录执行详情回填任务
- **THEN** 原记录被更新为包含 `_detail`，且 notices.content / origin_url 同步补齐
