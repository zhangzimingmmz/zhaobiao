# crawler-storage-schema Specification

## Purpose
定义统一公告存储表的结构、字段来源与 API 映射约束，确保爬虫落库与查询层使用同一套可追溯的数据模型。
## Requirements
### Requirement: 统一公告存储表与唯一键

系统 SHALL 使用**单一逻辑存储**（一张统一公告表，或按站点拆为两张表）承载所有爬虫落库的公告数据；表 SHALL 以 `(site, id)` 为业务唯一键，与《原始数据接口文档》及 SITE1/SITE2 去重约定一致；SHALL 不采用「一种业务类型一张表」的多表方案，以便 API 统一分页与筛选。

#### Scenario: 爬虫按 (site, id) 去重写入

- **WHEN** 爬虫写入或更新一条公告
- **THEN** 以 (site, id) 唯一标识该条；若已存在则更新，否则插入

#### Scenario: 多站点多类型共存于同一表或固定表集合

- **WHEN** 存在网站一（三类）与网站二（采购意向公开、采购公告）及后续新增站点
- **THEN** 所有类型 SHALL 存于同一张表（或固定两张表如 notices_site1、notices_site2），通过 site、categorynum/notice_type 等列区分，而非为每种类型单独建表

---

### Requirement: 原始表字段与落库来源

存储表 SHALL 包含《原始数据接口文档》中约定的**落库**字段的并集；字段命名可采用 snake_case 与原始接口对齐或做统一归一（如 webdate/noticeTime → publish_time）；SHALL 至少包含：site, id, title, 发布时间列, 来源/发布单位列, 地区相关列, 分类/类型列, 详情链接或原文链接列, 摘要/正文列；SHALL 包含 first_seen_at、last_seen_at 用于增量与去重；SHALL 可选保留 raw_json 列存原始响应便于排查与补采。

#### Scenario: 网站一列表落库字段可写入

- **WHEN** 爬虫写入网站一列表接口 result.records 的一条
- **THEN** 表 SHALL 能容纳该条中的落库字段（如 id, categorynum, title, webdate, zhuanzai, tradingsourcevalue, linkurl, content 等）及 site、first_seen_at、last_seen_at

#### Scenario: 网站二列表与详情落库字段可写入

- **WHEN** 爬虫写入网站二列表 data.rows 或详情 data 的一条
- **THEN** 表 SHALL 能容纳该条中的落库字段（如 id, title, author, noticeTime, regionName, regionCode, noticeType, openTenderCode, content, planId, budget 等）及 site、first_seen_at、last_seen_at

---

### Requirement: API 查询不依赖独立 API 表

列表与详情 API SHALL **直接查询**上述公告存储表（或基于该表的 VIEW）；SHALL 不要求维护一张与原始表同步的「API 专用」物理表；SHALL 通过 VIEW 或应用层映射将存储列名与结构转换为《接口文档-前端与小程序》约定的响应字段（如 publishTime、sourceName、categoryNum、originUrl、list/detail 单条结构）。

#### Scenario: 列表 API 可从存储表或视图返回

- **WHEN** 请求列表 API（如 /api/list）并传入 page、pageSize、category 等
- **THEN** 数据 SHALL 来自公告存储表（或该表上的 VIEW），经映射后满足接口文档中列表单条字段（id、title、publishTime、sourceName、regionName、regionCode、categoryNum、originUrl、summary 等）

#### Scenario: 详情 API 可从存储表或视图返回

- **WHEN** 请求详情 API（如 /api/detail/bid/:id 或 /api/detail/info/:id）
- **THEN** 数据 SHALL 来自同一公告存储表（或 VIEW），经映射后满足接口文档中详情字段（id、title、content、publishTime、originUrl 等）

---

### Requirement: 存储与前端字段映射可追溯

实现 SHALL 提供或文档化「存储列 → 前端/API 字段」的映射关系；SHALL 与《原始数据接口文档》落库建议及《接口文档-前端与小程序》列表/详情字段表可对照（如 webdate/noticeTime → publishTime，zhuanzai/author → sourceName，linkurl + baseUrl → originUrl），以便爬虫与 API 实现一致、前端无需二次重命名。

#### Scenario: 映射表或文档存在

- **WHEN** 开发实现 storage 或 API 层
- **THEN** 可从设计或 spec 中查到存储字段与前端接口字段的一一对应，且与两份接口文档一致

### Requirement: 项目分类列

notices 表 SHALL 包含 `purchase_nature` 列（TEXT，可空），用于存储 site2 采购公告的项目分类（1=货物、2=工程、3=服务）。数据来源为 site2 API 响应的 `purchaseNature` 字段。

#### Scenario: 表结构支持 purchase_nature

- **WHEN** 爬虫或 API 写入/查询 purchase_nature
- **THEN** 表 SHALL 具备该列，可空，与 purchase_manner 等列同级

