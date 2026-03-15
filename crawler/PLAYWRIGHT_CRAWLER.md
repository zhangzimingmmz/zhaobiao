# 使用 Playwright 实现爬虫

本文档说明如何用 **Playwright** 驱动真实浏览器实现《原始数据接口文档》中的网站一、网站二采集，以及如何规避或简化「依赖与未约定项」中的阻塞点。

---

## 1. 为何用 Playwright

| 问题 | 纯 HTTP 客户端 | Playwright |
|------|----------------|------------|
| 网站二签名头（nsssjss、sign、time、url） | 需逆向前端 JS，易随站点更新失效 | 浏览器内由站点 JS 自动生成，无需逆向 |
| 网站二 Cookie | 需分析 Set-Cookie 与顺序 | 访问页面即获得并保持会话 |
| 网站二验证码 verifyCode | 必须接 OCR/打码/人工 | 可截图后 OCR，或页面内人工输入后继续 |
| 网站一详情 path 规则 | 需二次抓包确认 id/linkurl → path | 可打开详情页并拦截 `/staticJson/*.json` 请求，直接拿到 URL 与响应 |

结论：用 Playwright **不必** 自己实现签名逻辑和 Cookie 管理，验证码可人机结合，详情 URL 可从真实请求中观察或拦截得到。

---

## 2. 整体策略

### 2.1 网站一（四川省公共资源交易网）

- **列表**：继续用 **HTTP 客户端**（如 `requests`）直接 POST `getFullTextDataNew`。接口文档已约定请求体与请求头，无签名，Playwright 非必须。
- **详情**（仅在需要时）：
  - **方案 A**：用 Playwright 打开列表页 → 点击某条进入详情页 → 使用 **请求拦截**（`page.route` / `request.response()`）捕获对 `/staticJson/{path}.json` 的请求，得到 path 与 JSON 内容。
  - **方案 B**：若已通过抓包或 Gemini 确认 path 与 `id`/`linkurl` 的映射，可直接 GET `/staticJson/{path}.json`，不必开浏览器。

### 2.2 网站二（四川政府采购网）

- **全链路在浏览器内完成**：
  1. 使用 Playwright 启动浏览器，访问列表入口页（如采购公告/采购意向公开列表页）。
  2. **Cookie**：随页面访问自动获得并保存在浏览器上下文中。
  3. **验证码**：
     - 页面加载或点击「查询」时会请求 getVerify 并显示验证码；
     - 可在 Playwright 中**拦截** `selectInfoForIndex` 的请求，在发出前由脚本注入正确的 `verifyCode`（若已通过 OCR/打码/人工得到）；
     - 或：**截图验证码区域** → 调用外部 OCR/打码接口 → 将结果填入输入框并提交，再由页面正常发起带签名的请求。
  4. **签名**：由站点前端 JS 在发起列表/详情请求时自动添加 `nsssjss`、`sign`、`time`、`url`，无需爬虫侧实现。
  5. **数据获取**：通过 **响应拦截**（`page.route` 或 `page.on("response")`）监听 `selectInfoForIndex`、`getInfoById`、`selectInfoByOpenTenderCode` 等 URL，从响应中解析 JSON 并落库或返回给调用方。

---

## 3. 技术要点

### 3.1 请求/响应拦截

- **Python**：`page.route(url_pattern, handler)`、`page.on("response", callback)`；在 handler 中可读取 `request.url`、`request.headers`、`response.body()` 等。
- **Node**：`page.route()`、`page.on("response")`，用法类似。

用于：  
- 网站二：监听 `**/selectInfoForIndex**`、`**/getInfoById**`、`**/selectInfoByOpenTenderCode**`，取响应 body 为 JSON。  
- 网站一详情：监听 `**/staticJson/*.json`，取 path 与 body。

### 3.2 验证码流程（网站二）

1. 打开列表页（或先打开首页再进列表页，视站点实际跳转而定）。
2. 等待验证码图片出现（如选择器 `img[src*="getVerify"]` 或包含验证码的容器）。
3. **方式 A**：对验证码元素截图 → 调用 OCR/打码 API → 将结果填入输入框，点击查询/搜索。  
4. **方式 B**：`page.pause()` 或延长 timeout，人工在浏览器中输入验证码并点击查询。  
5. 在 `response` 事件中捕获本次列表接口的 JSON；若返回需验证码错误，可重试（重新 getVerify 再识别再请求）。

### 3.3 无头与有头

- **无头（headless）**：适合生产、调度；若站点有反爬可能更易被限流。
- **有头（headed）**：便于调试验证码、观察请求；可配合 `slow_mo` 查看点击与请求顺序。

建议开发阶段用有头，确认流程后再切无头。

---

## 4. 目录与入口建议

```
crawler/
  requirements.txt          # playwright, requests 等
  PLAYWRIGHT_CRAWLER.md      # 本文档
  site1/
    client.py                # 列表 HTTP 客户端（现有设计）
    playwright_detail.py     # 可选：Playwright 打开详情页并拦截 staticJson
  site2/
    playwright_crawler.py    # 网站二：浏览器启动、拦截列表/详情、验证码占位
```

运行前需安装浏览器：`playwright install chromium`（或 `npx playwright install chromium`）。

---

## 5. 与《原始数据接口文档》的对应关系

| 文档章节 | Playwright 作用 |
|----------|-----------------|
| 1.1 网站一列表 | 不依赖 Playwright，HTTP 客户端即可 |
| 1.2 网站一详情 | 可选：用 Playwright 拦截 `/staticJson/{path}.json` 得到 path 与内容 |
| 2.0 getVerify | 浏览器访问列表页时会触发；可再单独请求并截图供 OCR |
| 2.1 / 2.3 列表 | 在页面内触发查询（或复现前端请求），通过响应拦截拿 `data.rows` |
| 2.2 / 2.4 详情 | 在页面内点击进入详情或由脚本构造请求，通过响应拦截拿详情 JSON |
| 三、依赖与未约定项 | 签名/Cookie 由浏览器与站点 JS 解决；验证码由 OCR/人工+脚本配合；网站一详情 path 由拦截观察 |

以上方案使「签名头、Cookie、验证码、详情 URL 规则」均可在不逆向签名、不手写 Cookie 逻辑的前提下，通过 Playwright 实现或辅助确认。
