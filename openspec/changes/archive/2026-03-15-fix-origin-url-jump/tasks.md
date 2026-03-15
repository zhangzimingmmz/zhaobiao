# Tasks: 修复跳转原地址功能

## 1. 后端 originUrl 拼装

- [x] 1.1 在 `_row_list_item` 中：当 origin_url 与 linkurl 均为空且 site 含 site2 时，按 `https://www.ccgp-sichuan.gov.cn/maincms-web/article?type=notice&id={id}&planId[={plan_id}]` 拼装 originUrl
- [x] 1.2 在 `_row_detail_bid` 中：同上，增加 site2 的 originUrl 拼装逻辑
- [x] 1.3 在 `_row_detail_info` 中：接收 site 参数，当 origin_url 与 linkurl 均为空且 site 含 site2 时，按相同规则拼装 originUrl；并修改 `detail_info` 路由调用处传入 `row["site"]`

## 2. 后端 sourceSiteName 字段

- [x] 2.1 在 `_row_detail_bid` 返回对象中增加 sourceSiteName：site 含 site1 时为「四川省公共资源交易平台」，含 site2 时为「四川省政府采购网」
- [x] 2.2 在 `_row_detail_info` 返回对象中增加 sourceSiteName，规则同上

## 3. 小程序 WebView 页面

- [x] 3.1 新增 `pages/webview/index` 页面，从路由参数 `url` 读取要加载的地址，使用 `<WebView src={url} />` 全屏展示
- [x] 3.2 在 `app.config.ts` 的 pages 中注册 `pages/webview/index`

## 4. 小程序招投标详情页

- [x] 4.1 当 detail.originUrl 存在时显示「查看原文」按钮，点击后 `Taro.navigateTo({ url: '/pages/webview/index?url=' + encodeURIComponent(detail.originUrl) })`
- [x] 4.2 当 detail.originUrl 为空且 detail.sourceSiteName 存在时，在页脚或合适位置展示「来源：{sourceSiteName}」

## 5. 小程序信息详情页

- [x] 5.1 当 detail.originUrl 存在时显示「查看原文」按钮，点击后跳转 WebView 页面
- [x] 5.2 当 detail.originUrl 为空且 detail.sourceSiteName 存在时，展示「来源：{sourceSiteName}」

## 6. 业务域名配置（上线前）

- [ ] 6.1 在微信公众平台「开发 - 开发管理 - 开发设置」中，将 `ggzyjy.sc.gov.cn`、`www.ccgp-sichuan.gov.cn` 加入业务域名
