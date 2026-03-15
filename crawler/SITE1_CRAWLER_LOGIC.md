# 网站一采集逻辑设计

## 1. 目标范围

站点：

- `https://ggzyjy.sc.gov.cn/jyxx/transactionInfo.html`

本项目只采集以下 3 类公告：

1. 工程建设 / 招标计划：`002001009`
2. 工程建设 / 招标公告：`002001001`
3. 政府采购 / 采购公告：`002002001`

不采集以下内容：

- 其他业务类型
- 上述业务类型下的其他信息类型
- 页面 DOM 渲染结果
- 从 `content` 中二次推导出的字段

## 2. 主接口

唯一主链路接口：

- `POST https://ggzyjy.sc.gov.cn/inteligentsearch/rest/esinteligentsearch/getFullTextDataNew`

说明：

- 爬虫应直接调用该接口，不模拟前端点击。
- 不以页面翻页逻辑为主，不依赖大页数后的回退接口。
- 请求头使用：

```http
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
User-Agent: Mozilla/5.0
```

- 请求体不是表单字段，而是原始 JSON 字符串。

## 3. 不依赖回退接口的原因

前端脚本中存在备用接口：

- `/WebBuilder/rest/searchindb/get`

但采集方案不应依赖它，原因如下：

- 页面默认列表走的不是该接口，而是全文检索主接口。
- 该接口只在前端翻页超过 40 页后才尝试切换。
- 从采集设计上，可以通过缩小时间窗口，始终将单次抓取控制在主接口可处理范围内。
- 初始化和增量都可以通过时间切片规避该路径，减少不确定性。

因此，正式方案采用：

- 主接口
- 时间切片
- 偏移分页

## 4. 分类与请求条件

### 4.1 工程建设 / 招标计划

- `categorynum = 002001009`

对应 `condition`：

```json
[
  {
    "fieldName": "categorynum",
    "equal": "002001009",
    "notEqual": null,
    "equalList": null,
    "notEqualList": null,
    "isLike": true,
    "likeType": 2
  }
]
```

### 4.2 工程建设 / 招标公告

- `categorynum = 002001001`

对应 `condition`：

```json
[
  {
    "fieldName": "categorynum",
    "equal": "002001001",
    "notEqual": null,
    "equalList": null,
    "notEqualList": null,
    "isLike": true,
    "likeType": 2
  }
]
```

### 4.3 政府采购 / 采购公告

- `categorynum = 002002001`

对应 `condition`：

```json
[
  {
    "fieldName": "ZHUANZAI",
    "equal": "四川省政府采购网",
    "notEqual": null,
    "equalList": null,
    "notEqualList": null
  },
  {
    "fieldName": "categorynum",
    "equal": "002002001",
    "notEqual": null,
    "equalList": null,
    "notEqualList": null,
    "isLike": true,
    "likeType": 2
  }
]
```

说明：

- 政府采购类建议保留 `ZHUANZAI = 四川省政府采购网` 这一条件，以尽量贴近页面行为。

## 5. 通用请求模板

```json
{
  "token": "",
  "pn": 0,
  "rn": 12,
  "sdt": "",
  "edt": "",
  "wd": "",
  "inc_wd": "",
  "exc_wd": "",
  "fields": "",
  "cnum": "",
  "sort": "{\"ordernum\":\"0\",\"webdate\":\"0\"}",
  "ssort": "",
  "cl": 10000,
  "terminal": "",
  "condition": [],
  "time": [
    {
      "fieldName": "webdate",
      "startTime": "2026-03-14 00:00:00",
      "endTime": "2026-03-14 23:59:59"
    }
  ],
  "highlights": "",
  "statistics": null,
  "unionCondition": null,
  "accuracy": "",
  "noParticiple": "1",
  "searchRange": null,
  "noWd": true
}
```

运行时替换以下字段：

- `pn`
- `condition`
- `time[0].startTime`
- `time[0].endTime`

## 6. 分页规则

分页不是页码制，而是偏移量制：

- 第一页：`pn = 0`
- 第二页：`pn = 12`
- 第三页：`pn = 24`

固定参数：

- `rn = 12`

停止条件：

- `pn >= totalcount`
- 或当前页 `records` 为空

## 7. 初始化采集方案

### 7.1 适用场景

用于一次性回填历史数据，例如：

- 抓取 `2026-03-01 00:00:00` 以后发布的数据
- 抓取某个业务上线日以后的全量数据

### 7.2 初始化原则

初始化不应直接按大时间段翻页到底，而应采用：

- 分类独立处理
- 时间窗口探测
- 超阈值自动切小窗口
- 只使用主接口

### 7.3 推荐流程

对每个分类分别执行：

1. 设定初始化起点，例如 `2026-03-01 00:00:00`
2. 以“天”为初始窗口切分时间
3. 对每个日窗口先发探测请求
4. 若窗口数据量过大，则继续拆分为半天或小时窗口
5. 当窗口落入安全范围后，再正式分页抓取

示例窗口：

- `2026-03-01 00:00:00 ~ 2026-03-01 23:59:59`
- `2026-03-02 00:00:00 ~ 2026-03-02 23:59:59`

若某日数据量过大，再拆分为：

- `2026-03-01 00:00:00 ~ 2026-03-01 11:59:59`
- `2026-03-01 12:00:00 ~ 2026-03-01 23:59:59`

### 7.4 探测请求

探测请求建议使用：

- `pn = 0`
- `rn = 1`

只读取：

- `result.totalcount`

### 7.5 安全阈值

建议不要使用 480 这个极限值，而是使用更保守阈值：

- 安全阈值：`360`

处理规则：

- `totalcount = 0`：跳过
- `totalcount <= 360`：直接分页抓
- `totalcount > 360`：继续切小时间窗口

### 7.6 初始化伪代码

```text
for category in [002001009, 002001001, 002002001]:
    for window in daily_windows(start, end):
        crawl_window(category, window.start, window.end)

crawl_window(category, start_time, end_time):
    total = probe_total(category, start_time, end_time)

    if total == 0:
        return

    if total > 360:
        child_windows = split_window(start_time, end_time)
        for child in child_windows:
            crawl_window(category, child.start, child.end)
        return

    pn = 0
    while pn < total:
        records = fetch_records(category, start_time, end_time, pn, rn=12)
        if not records:
            break
        save(records)
        pn += 12
```

## 8. 增量采集方案

### 8.1 调度方式

增量任务每 2 小时运行一次。

建议调度时间：

- `00:05`
- `02:05`
- `04:05`
- `...`

### 8.2 时间窗口

每次抓取“上一个完整两小时窗口”，例如：

- `14:05` 运行时，抓 `12:00:00 ~ 13:59:59`
- `16:05` 运行时，抓 `14:00:00 ~ 15:59:59`

这样做的目的：

- 使用整点到整点的稳定窗口
- 给站点索引写入留几分钟缓冲

### 8.3 增量流程

对每个分类分别执行：

1. 计算上一完整两小时窗口
2. 先发探测请求
3. 若数据量正常，则直接分页抓取
4. 若极少数窗口数据量异常偏大，则继续切为 1 小时窗口

### 8.4 增量伪代码

```text
window = previous_complete_two_hour_window(now)

for category in [002001009, 002001001, 002002001]:
    crawl_window(category, window.start, window.end)
```

## 9. 补偿采集方案

为避免索引延迟、任务失败或补发公告，建议增加补偿任务。

推荐方案：

- 每天固定一次
- 回抓最近 48 小时
- 与增量任务共用相同逻辑
- 通过唯一键去重

这样可以覆盖：

- 站点延迟入索引
- 定时任务偶发失败
- 公告补发或时间轻微漂移

## 10. 数据落库字段

建议只保存接口中稳定直接返回的字段，不做正文推导。

### 10.1 建议保留字段

- `site`
- `id`
- `categorynum`
- `title`
- `webdate`
- `infodate`
- `zhuanzai`
- `tradingsourcevalue`
- `linkurl`
- `content`
- `raw_json`
- `first_seen_at`
- `last_seen_at`

### 10.2 建议忽略字段

以下字段不建议作为核心依赖：

- `unitname`
- `department`
- `telephone`
- `attachname`
- `score`
- `highlight`
- `ordernum`
- `sysclicktimes`
- `syscategory`
- `syscollectguid`
- `sysscore`
- `istop`

### 10.3 唯一键

建议唯一键：

- `(site, id)`

其中：

- `site = site1_sc_ggzyjy`

## 11. 详情抓取策略

主接口返回的 `linkurl` 为详情页相对路径。

绝对地址拼接方式：

- `https://ggzyjy.sc.gov.cn` + `linkurl`

建议将详情抓取设计为第二阶段任务：

1. 列表接口先落库
2. 再按 `linkurl` 异步抓详情页 HTML
3. 详情正文如已在 `content` 中满足展示，可延后处理 HTML 解析

当前阶段不要求：

- 从 `content` 中解析金额
- 从详情 HTML 中强拆采购人、代理机构等字段
- 对详情做结构化抽取

## 12. 与前端展示的边界

本采集逻辑仅负责“稳定原始数据”。

不在采集阶段做以下事情：

- 推导业务类型名称
- 推导信息类型名称
- 从正文中提取金额
- 从正文中提取采购人、招标人、代理机构
- 拼接用于卡片展示的业务字段

如果前端需要这些字段，应在后续单独设计“展示层加工规则”，不要混入采集主流程。

## 13. 错误处理

建议至少处理以下异常：

- 网络超时
- TLS 连接中断
- 接口 5xx
- 返回 JSON 非法
- `result` 缺失
- `records` 缺失

建议策略：

- 单请求重试 3 次
- 重试间隔指数退避
- 单窗口失败写入失败队列
- 当日补偿任务再次回抓

## 14. 最终执行规则

正式采集规则总结如下：

1. 只抓 3 个白名单分类
2. 只使用全文检索主接口
3. 初始化按天切片，超阈值则继续拆窗
4. 增量每 2 小时抓一次，抓上一个完整 2 小时窗口
5. 每天增加最近 48 小时补偿回抓
6. 用 `(site, id)` 去重
7. 采集阶段只保留稳定原始字段，不做正文推导

## 15. 后续实现建议

后续代码实现时建议拆成以下模块：

- `site1/config.py`
  - 分类配置
  - 请求模板
  - 调度参数

- `site1/client.py`
  - 主接口请求
  - 重试
  - 超时控制

- `site1/windowing.py`
  - 日窗口生成
  - 小时窗口拆分
  - 两小时增量窗口计算

- `site1/tasks/backfill.py`
  - 初始化任务

- `site1/tasks/incremental.py`
  - 增量任务

- `site1/tasks/recovery.py`
  - 补偿任务

- `site1/storage.py`
  - 去重
  - 落库
  - 状态更新
