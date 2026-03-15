# Spec: storage-dict-tables

## ADDED Requirements

### Requirement: 地区字典表

系统 SHALL 提供**地区字典表**（如 dict_region），用于存储地区编码与名称（含层级或父子关系）；数据来源 SHALL 为网站二 getRegionJson 或等效接口/配置；表 SHALL 具备唯一键（如 region_code 或 id），以便 notices.region_code / tradingsourcevalue 可与之逻辑关联；API 或应用层 SHALL 可使用该表解析地区展示名称或提供筛选选项。

#### Scenario: 地区表可被爬虫或任务写入

- **WHEN** 爬虫或定时任务调用 getRegionJson（或读取配置）
- **THEN** 可将地区列表写入 dict_region，以 region_code（或约定主键）去重更新

#### Scenario: 列表或筛选 API 可基于地区表返回选项或名称

- **WHEN** 前端请求地区筛选选项或列表需要 regionName
- **THEN** 数据 SHALL 可来自 dict_region（或经 JOIN/映射得到），与 notices 中 region_code / tradingsourcevalue 对应

---

### Requirement: 采购方式字典表

系统 SHALL 提供**采购方式字典表**（如 dict_purchase_manner），用于存储采购方式编码与名称；数据来源 SHALL 为网站二 getDictInfo（dictType 为采购方式相关）或等效配置；表 SHALL 具备唯一键（如 dict_code），以便 notices.purchase_manner 可与之逻辑关联；API SHALL 可使用该表提供筛选选项或展示名称。

#### Scenario: 采购方式表可被爬虫或配置初始化

- **WHEN** 爬虫拉取 getDictInfo 或静态配置加载
- **THEN** 采购方式列表 SHALL 可写入 dict_purchase_manner，按 dict_code 去重

#### Scenario: 筛选或详情可展示采购方式名称

- **WHEN** 列表或详情需展示采购方式名称
- **THEN** 可依据 notices.purchase_manner 从 dict_purchase_manner 解析名称

---

### Requirement: 项目/公告分类字典表

系统 SHALL 提供**项目或公告分类字典表**（如 dict_notice_category），用于存储业务类型编号（category_num / noticeType）与展示名称（如招标计划、采购意向公开、采购公告）；数据来源 SHALL 为爬虫接口或静态配置；表 SHALL 具备唯一键（如 category_num），以便 notices.category_num 可与之关联；列表/详情 API 的 categoryName SHALL 可来自该表或与之一致的映射。

#### Scenario: 分类表可被初始化或爬虫更新

- **WHEN** 系统初始化或爬虫拉取到分类数据
- **THEN** 分类编号与名称 SHALL 可写入 dict_notice_category，按 category_num 去重

#### Scenario: 列表单条可展示 categoryName

- **WHEN** 前端请求列表并需要 categoryName
- **THEN** categoryName SHALL 可来自 dict_notice_category 对 category_num 的映射，与《接口文档-前端与小程序》约定一致

---

### Requirement: 字典数据 API

系统 SHALL 提供供前端使用的**字典数据接口**（如 GET /api/dict/regions、GET /api/dict/purchase-manner、GET /api/dict/categories，或统一 GET /api/dict?type=regions|purchase-manner|categories）；响应 SHALL 包含字典项列表（至少含编码与名称），便于前端渲染筛选下拉与展示名称。

#### Scenario: 前端可获取地区选项

- **WHEN** 前端请求地区字典接口
- **THEN** 返回地区列表（如 regionCode、regionFullName 或等价字段），可用于筛选与展示

#### Scenario: 前端可获取采购方式或分类选项

- **WHEN** 前端请求采购方式或分类字典接口
- **THEN** 返回对应字典项列表，可用于筛选与 categoryName 等展示
