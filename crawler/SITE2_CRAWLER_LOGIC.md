# 网站二采集逻辑设计

## 1. 目标范围

站点：

- `https://www.ccgp-sichuan.gov.cn/`

本项目只采集以下 2 类公告：

1. 公告信息 / 采购公告：列表筛选值 `noticeType=00101`
2. 公示信息 / 采购意向公开：列表筛选值 `noticeType=59`

不采集以下内容：

- 其他公告类型
- 首页 DOM 渲染结果
- 从 `content` 中二次推导出的结构化字段
- 验证码识别实现本身

## 2. 正式链路概览

网站二的正式链路应以浏览器真实请求为准，不再以临时公开接口为主。

正式采集路径：

1. 列表统一走：
   - `GET /gpcms/rest/web/v2/info/selectInfoForIndex`
2. 采购公告详情走：
   - `GET /gpcms/rest/web/v2/index/selectInfoByOpenTenderCode`
3. 采购意向公开详情走：
   - `GET /gpcms/rest/web/v2/info/getInfoById`

采集顺序：

1. 按类型和时间窗口请求列表
2. 按页码抓完当前窗口全部列表页
3. 对每条列表记录按类型请求详情
4. 保存结构化字段 + `content` HTML + 原始 JSON

说明：

- 站点二是页码制分页，不是偏移量制。
- 采购公告的列表筛选值 `00101` 是大类筛选值，但列表行里的真实 `noticeType` 可能是更细分的子类型，例如 `001011`、`001016`。
- 采购公告详情接口按 `planId` 返回的是同一项目计划下的多条记录，必须再按原始列表 `id` 精确匹配。

## 3. 前置条件

### 3.1 验证码

列表接口 `selectInfoForIndex` 需要 `verifyCode`。

本方案不设计验证码识别实现，仅约定一个外部前置模块：

- 输入：当前类型、当前会话
- 输出：
  - `verifyCode`
  - 对应会话 cookie

因此正式采集链路依赖：

- 验证码获取模块
- 会话保持模块

### 3.2 签名头

真实浏览器请求中包含以下动态请求头：

- `nsssjss`
- `sign`
- `time`
- `url`
- `referer`

同时 query 中包含：

- `_t=<时间戳毫秒>`

本方案不展开签名算法实现，只约定一个外部签名模块：

- 输入：请求路径、时间戳、Referer、当前会话
- 输出：上述动态请求头

### 3.3 会话与 Cookie

建议所有列表和详情请求都复用同一会话对象，并带上浏览器同类 cookie。

已观测到的 cookie 形态：

- `regionCode=510001`
- `regionFullName=四川省`
- `regionRemark=1`

注意：

- 验证码大概率与当前会话绑定
- 不应在同一个采集窗口中频繁更换 cookie jar

### 3.4 代理配置

site2 采集使用青果短效代理服务，配置位于 `crawler/site2/config.py`：

- `PROXY_EXTRACT_URL`：代理提取接口，包含 key 参数用于认证
- `PROXY_USER`：代理认证用户名（对应 authkey）
- `PROXY_PASS`：代理认证密码（对应 authpwd）
- `SESSION_TTL`：会话生存时间，默认 50 秒（青果短效代理有效期 60 秒）

代理特性：

- 短效代理 IP 有效期为 60 秒
- 系统在 50 秒时主动轮换 session，避免代理过期错误
- 同一 session 在有效期内可复用，减少 IP 消耗
- 代理提取失败会重试最多 8 次（`PROXY_EXTRACT_ATTEMPTS`）

更新代理配置：

1. 修改 `crawler/site2/config.py` 中的认证信息
2. 重新构建后端镜像：`docker compose -f docker-compose.backend.yml build --no-cache`
3. 重启服务：`docker compose -f docker-compose.backend.yml up -d`

## 4. 固定参数

### 4.1 站点参数

- `siteId = 94c965cc-c55d-4f92-8469-d5875c68bd04`
- 正式采集的统一 `channel = c5bff13f-21ca-4dac-b158-cb40accd3035`

说明：

- 即使“采购意向公开”在前端页面入口属于“公示信息”，实际成功列表请求仍使用上述 `channel`。

### 4.2 类型参数

#### 采购公告

- 页面入口：`/maincms-web/noticeInformation?typeId=ggxx`
- 列表筛选值：`noticeType=00101`
- 列表 Referer：
  - `https://www.ccgp-sichuan.gov.cn/maincms-web/noticeInformation?typeId=ggxx`

#### 采购意向公开

- 页面入口：`/maincms-web/massageListPage?typeId=gsxx-noticeType`
- 列表筛选值：`noticeType=59`
- 列表 Referer：
  - `https://www.ccgp-sichuan.gov.cn/maincms-web/massageListPage?typeId=gsxx-noticeType`

## 5. 列表接口

统一列表接口：

- `GET https://www.ccgp-sichuan.gov.cn/gpcms/rest/web/v2/info/selectInfoForIndex`

### 5.1 通用请求参数

建议保留浏览器原始参数结构，即使部分为空也照常发送：

- `currPage`
- `pageSize`
- `siteId`
- `channel`
- `noticeType`
- `title`
- `region`
- `regionCode`
- `cityOrArea`
- `purchaseManner`
- `openTenderCode`
- `purchaser`
- `agency`
- `purchaseNature`
- `operationStartTime`
- `operationEndTime`
- `verifyCode`
- `_t`

说明：

- `currPage` 为页码，从 `1` 开始
- `pageSize` 当前已验证值为 `10`
- 更大的 `pageSize` 是否稳定支持，需后续联调验证
- 初始化阶段建议先用 `10`

### 5.2 通用请求头

建议至少带上：

```http
Accept: */*
User-Agent: Mozilla/5.0
Referer: <按类型对应页面>
nsssjss: <动态值>
sign: <动态值>
time: <时间戳毫秒>
url: /gpcms/rest/web/v2/info/selectInfoForIndex
```

说明：

- `time` 与 query 中 `_t` 建议保持同一毫秒值
- `url` 使用请求 path，不含域名和 query

### 5.3 列表响应结构

响应顶层结构：

```json
{
  "code": "200",
  "msg": "操作成功",
  "data": {
    "rows": [],
    "total": 197681
  }
}
```

其中：

- `data.rows`：当前页列表
- `data.total`：当前筛选条件下总条数

## 6. 采购公告列表

### 6.1 请求模板

```text
GET /gpcms/rest/web/v2/info/selectInfoForIndex

currPage=1
pageSize=10
siteId=94c965cc-c55d-4f92-8469-d5875c68bd04
channel=c5bff13f-21ca-4dac-b158-cb40accd3035
noticeType=00101
title=
region=
regionCode=
cityOrArea=
purchaseManner=
openTenderCode=
purchaser=
agency=
purchaseNature=
operationStartTime=2026-03-14 00:00:00
operationEndTime=2026-03-14 23:59:59
verifyCode=<外部模块提供>
_t=<时间戳毫秒>
```

### 6.2 列表稳定字段

采购公告列表已验证可直接拿到的主要字段包括：

- `id`
- `title`
- `author`
- `description`
- `noticeTime`
- `regionName`
- `purchaser`
- `purchaseManner`
- `agency`
- `regionCode`
- `noticeType`
- `openTenderCode`
- `openTenderTime`
- `budget`
- `planId`
- `catalogueNameList`
- `dataSource`
- `attchList`
- `siteName`
- `channelName`
- `purchaserAddr`
- `purchaserLinkPhone`

说明：

- 列表里的 `content` 通常为 `null`
- 正文以详情接口为准
- 列表筛选值是 `00101`，但记录实际 `noticeType` 需原样保存，不能强行改写为 `00101`

## 7. 采购意向公开列表

### 7.1 请求模板

```text
GET /gpcms/rest/web/v2/info/selectInfoForIndex

currPage=1
pageSize=10
siteId=94c965cc-c55d-4f92-8469-d5875c68bd04
channel=c5bff13f-21ca-4dac-b158-cb40accd3035
noticeType=59
title=
purchaseManner=
openTenderCode=
purchaser=
agency=
purchaseNature=
operationStartTime=2026-03-14 00:00:00
operationEndTime=2026-03-14 23:59:59
verifyCode=<外部模块提供>
_t=<时间戳毫秒>
```

### 7.2 列表稳定字段

采购意向公开列表已验证可直接拿到的主要字段包括：

- `id`
- `title`
- `author`
- `description`
- `noticeTime`
- `regionName`
- `purchaser`
- `regionCode`
- `noticeType`
- `openTenderCode`
- `dataSource`
- `siteName`
- `channelName`

说明：

- 该类型列表中通常没有：
  - `agency`
  - `purchaseManner`
  - `budget`
  - `openTenderTime`
- 这些值如果存在于正文表格中，也不应在采集层做正文抽取

## 8. 详情接口

### 8.1 采购公告详情

采购公告详情接口：

- `GET https://www.ccgp-sichuan.gov.cn/gpcms/rest/web/v2/index/selectInfoByOpenTenderCode`

请求参数：

- `site=94c965cc-c55d-4f92-8469-d5875c68bd04`
- `planId=<列表行中的 planId>`
- `_t=<时间戳毫秒>`

请求头示例：

```http
Accept: */*
User-Agent: Mozilla/5.0
Referer: https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id=<id>&planId=<planId>
nsssjss: <动态值>
sign: <动态值>
time: <时间戳毫秒>
url: /gpcms/rest/web/v2/index/selectInfoByOpenTenderCode
```

说明：

- 已验证的详情请求不需要 `verifyCode`
- 但仍建议保留 `_t` 和动态签名头

响应结构：

```json
{
  "code": "200",
  "msg": "操作成功",
  "data": {
    "rows": [],
    "total": 2
  }
}
```

关键规则：

1. 该接口按 `planId` 返回的是一个项目计划下的多条相关记录
2. 同一个 `planId` 可能同时返回：
   - 当前采购公告
   - 关联采购意向公开
   - 其他相关公告
3. 正式详情记录必须按原始列表 `id` 精确匹配：
   - `detail_row.id == list_row.id`

因此采购公告详情流程应为：

1. 从列表行读取 `planId` 和 `id`
2. 调用 `selectInfoByOpenTenderCode`
3. 在返回的 `data.rows` 中查找 `id` 与列表行相同的记录
4. 将该记录作为当前公告详情

若未匹配到相同 `id`，建议策略：

1. 先重试一次
2. 仍失败则记录异常
3. 可选降级：
   - `GET /gpcms/rest/web/v2/info/getInfoById?id=<id>`

若列表行 `planId` 为空，直接走降级路径：

- `GET /gpcms/rest/web/v2/info/getInfoById?id=<id>`

### 8.2 采购意向公开详情

采购意向公开详情接口：

- `GET https://www.ccgp-sichuan.gov.cn/gpcms/rest/web/v2/info/getInfoById`

请求参数：

- `id=<列表行中的 id>`
- `_t=<时间戳毫秒>`

请求头示例：

```http
Accept: */*
User-Agent: Mozilla/5.0
Referer: https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id=<id>&planId
nsssjss: <动态值>
sign: <动态值>
time: <时间戳毫秒>
url: /gpcms/rest/web/v2/info/getInfoById
```

说明：

- 已验证的详情请求不需要 `verifyCode`
- 但仍建议保留 `_t` 和动态签名头

响应结构：

```json
{
  "code": "200",
  "msg": "操作成功",
  "data": {}
}
```

采购意向公开详情已验证可直接获得：

- `id`
- `title`
- `author`
- `description`
- `noticeTime`
- `regionName`
- `purchaser`
- `regionCode`
- `noticeType`
- `noticeTypeName`
- `openTenderCode`
- `content`

## 9. 附件与正文处理

### 9.1 正文

两类详情都以 `content` HTML 作为正文主来源。

说明：

- 采购公告正文是完整 HTML，包含正文和可能的附件链接区块
- 采购意向公开正文通常是 HTML 表格

### 9.2 附件

不要只依赖 `attchList` 或 `attchs`。

原因：

- 已验证样本中，采购公告详情的 `attchList` 和 `attchs` 为空
- 但 `content` HTML 内仍可能存在“相关附件”链接

因此附件处理建议分两层：

1. 第一层：原样保存 `attchList` / `attchs`
2. 第二层：如业务需要，再从 `content` HTML 中额外解析附件链接

当前采集主流程只要求：

- 保存原始 `content`
- 保存原始 `attchList`
- 不在主流程里做复杂正文抽取

## 10. 初始化采集方案

### 10.1 适用场景

用于一次性回填历史数据，例如：

- 抓取 `2026-03-01 00:00:00` 以后发布的数据
- 抓取某个产品上线日以后的全量数据

### 10.2 初始化原则

由于站点总量极大：

- 采购公告样本总量已观测到 `197681`
- 采购意向公开样本总量已观测到 `207805`

因此初始化不能全量直接翻页到底，必须采用：

- 类型独立处理
- 时间窗口切片
- 每个窗口单独分页
- 逐条拉详情

### 10.3 推荐时间切片

初始化建议先按“天”切片：

- `2026-03-01 00:00:00 ~ 2026-03-01 23:59:59`
- `2026-03-02 00:00:00 ~ 2026-03-02 23:59:59`

若某天页面数过大，再继续拆分为：

- 半天窗口
- 1 小时窗口

### 10.4 探测页

每个时间窗口先请求第一页：

- `currPage = 1`
- `pageSize = 10`

只读取：

- `data.total`

据此计算：

- `page_count = ceil(total / pageSize)`

### 10.5 拆窗阈值

建议不要让单窗口页数过大。

推荐阈值：

- `page_count <= 200`：直接分页抓取
- `page_count > 200`：继续切小时间窗口

说明：

- 后续如果验证更大 `pageSize` 可稳定支持，可再调整阈值

### 10.6 初始化流程

对每个类型分别执行：

1. 生成日窗口
2. 对每个窗口请求第一页，读取 `total`
3. 若总页数超阈值，则拆成更小时间窗口
4. 对当前窗口从 `currPage=1` 翻到 `currPage=page_count`
5. 对每条记录请求详情
6. 保存结构化字段、正文 HTML、原始快照

### 10.7 初始化伪代码

```text
for target in [00101, 59]:
    for window in daily_windows(start, end):
        crawl_window(target, window.start, window.end)

crawl_window(target, start_time, end_time):
    page1 = fetch_list_page(target, start_time, end_time, currPage=1, pageSize=10)
    total = page1.data.total
    page_count = ceil(total / 10)

    if total == 0:
        return

    if page_count > 200:
        for child in split_window(start_time, end_time):
            crawl_window(target, child.start, child.end)
        return

    persist_list_page(page1)
    for record in page1.rows:
        fetch_and_persist_detail(record, target)

    for currPage in range(2, page_count + 1):
        page = fetch_list_page(target, start_time, end_time, currPage, 10)
        persist_list_page(page)
        for record in page.rows:
            fetch_and_persist_detail(record, target)
```

## 11. 增量采集方案

### 11.1 调度方式

增量任务每 2 小时执行一次。

建议调度时间：

- `00:05`
- `02:05`
- `04:05`
- `...`

### 11.2 时间窗口

每次抓取上一个完整两小时窗口，例如：

- `14:05` 运行，抓 `12:00:00 ~ 13:59:59`
- `16:05` 运行，抓 `14:00:00 ~ 15:59:59`

### 11.3 增量流程

对每个类型分别执行：

1. 计算上一完整两小时窗口
2. 请求第一页获取 `total`
3. 若页数正常，则直接分页抓完整窗口
4. 若极少数窗口页数异常大，则继续拆成 1 小时窗口
5. 对新记录逐条抓详情

### 11.4 增量伪代码

```text
window = previous_complete_two_hour_window(now)

for target in [00101, 59]:
    crawl_window(target, window.start, window.end)
```

## 12. 补偿采集方案

为覆盖以下情况，建议增加补偿任务：

- 验证码模块偶发失败
- 单次列表抓取失败
- 详情请求失败
- 网站延迟发布

推荐补偿方案：

- 每天固定一次
- 回抓最近 48 小时
- 与增量任务使用同一采集逻辑
- 通过唯一键去重

## 13. 数据落库字段

### 13.1 建议保留的公共字段

- `site`
- `id`
- `siteId`
- `channel`
- `query_notice_type`
- `noticeType`
- `title`
- `author`
- `description`
- `noticeTime`
- `regionName`
- `regionCode`
- `purchaser`
- `agency`
- `openTenderCode`
- `planId`
- `content`
- `attchList`
- `raw_list_json`
- `raw_detail_json`
- `first_seen_at`
- `last_seen_at`

说明：

- `query_notice_type` 表示列表筛选值：
  - `00101`
  - `59`
- `noticeType` 表示记录自身的真实类型值

### 13.2 采购公告建议增加保留字段

- `purchaseManner`
- `openTenderTime`
- `budget`
- `catalogueNameList`
- `purchaserAddr`
- `purchaserLinkPhone`

### 13.3 采购意向公开建议增加保留字段

采购意向公开明细结构化字段较少，重点保留：

- `noticeTypeName`
- `content`

说明：

- 采购意向中的预算、预计采购时间等通常只出现在 `content` HTML 表格内
- 采集层不应再从正文中拆表生成新字段

### 13.4 唯一键

建议唯一键：

- `(site, id)`

其中：

- `site = site2_ccgp_sichuan`

### 13.5 关联键

如后续需要构建“公告与采购意向关联”，可额外保存：

- `(site, planId)` 作为采购公告链路的项目关联键
- `(site, openTenderCode)` 作为业务单号辅助键

但这些都不能替代主唯一键 `(site, id)`。

## 14. 错误处理

建议至少处理以下异常：

- 验证码失效
- 验证码错误
- 动态签名失效
- 请求超时
- 站点 5xx
- 响应非 JSON
- `data.rows` 缺失
- 采购公告详情返回多行但未找到原始 `id`
- 采购意向详情 `data` 为空

建议策略：

1. 单请求重试 3 次
2. 使用指数退避
3. 列表页失败时，整页写入失败队列
4. 详情失败时，记录为待补抓
5. 补偿任务再次回抓最近 48 小时

## 15. 最终执行规则

正式采集规则总结如下：

1. 只抓 `00101` 和 `59` 两类目标
2. 列表统一走 `selectInfoForIndex`
3. 采购公告详情走 `selectInfoByOpenTenderCode(planId)`，再按原始 `id` 匹配
4. 采购意向公开详情走 `getInfoById(id)`
5. 初始化按时间切片 + 页码翻页执行
6. 增量每 2 小时抓上一个完整两小时窗口
7. 每天增加最近 48 小时补偿回抓
8. 用 `(site, id)` 去重
9. 采集层只保存稳定原始字段和正文 HTML，不做正文推导
