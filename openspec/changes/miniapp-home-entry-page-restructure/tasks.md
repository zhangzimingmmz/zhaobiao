## 1. Brand Hero Restructure

- [x] 1.1 将 `miniapp/src/pages/index/index.tsx` 中现有的 `TopBar + hero` 组合重构为首页专用品牌横幅结构，包含品牌标题、副标题和轻装饰图形。
- [x] 1.2 在 `miniapp/src/pages/index/index.scss` 中实现深蓝品牌横幅样式，并控制其与全站 white-blue 设计 token 保持一致。

## 2. Entry Card Simplification

- [x] 2.1 删除首页搜索入口条、平台说明带，以及首页入口卡中的副标题与推荐 badge，只保留三个频道入口。
- [x] 2.2 将三张首页入口卡改成“大入口按钮卡”样式，统一图标块、标题和箭头层级，并确保整卡点击感更强。

## 3. Layout Density And Validation

- [x] 3.1 调整首页整体垂直节奏，使首屏稳定为“品牌横幅 + 三入口”，不再依赖底部说明区承接长屏留白。
- [ ] 3.2 重新编译小程序并在微信开发者工具中核对首页与目标稿的结构一致性，确认首页已不再呈现搜索/说明混合结构。
