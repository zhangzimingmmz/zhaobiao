## Why

当前小程序首页虽然功能完整,但视觉语言过于依赖 `taro-ui` 默认控件,导致主导航、分段切换、搜索与筛选区呈现出明显的旧式后台/表单感。随着首页已经承载工程建设、政府采购、信息展示三类核心内容,有必要把首页从“查询工具界面”提升为更现代、更有层级、更接近内容产品的主入口。

## What Changes

- 对小程序首页进行一次视觉层级重构,减少连续堆叠的默认分段控件,重建首页主次信息架构。
- **BREAKING** 首页主导航、次级切换、搜索与筛选条不再以 `taro-ui` 默认 `AtSegmentedControl` / `AtSearchBar` 作为主要视觉骨架。
- 重做首页卡片的层级、留白、标签和时间信息组织方式,让工程建设卡片与信息展示卡片都更具内容产品感。
- 调整首页、收藏、我的等一级页的 header / bottom-nav 视觉语言,使一级页与详情页在气质上更加统一且区分明确。
- 在不改变现有 API 与业务规则的前提下,保留现有数据筛选和导航行为,重点升级视觉表达与交互质感。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `miniapp-home-ui-parity`: 首页默认结构与层级从“忠实复刻旧 `ui` 参考”调整为“保留业务结构但允许重建更现代的视觉与层级”。
- `miniapp-home-filter-modes`: 首页控制区从通用分段控件堆叠调整为按状态定制的频道导航、搜索和筛选工具条。
- `miniapp-home-card-presentation`: 首页卡片的视觉层次、信息密度与状态标签要求更新,不再接受过于后台化的默认卡片风格。
- `miniapp-primary-navigation-shell`: 一级导航壳需要具备更清晰的品牌感与导航识别度,而不是仅满足功能分区。
- `miniapp-page-family-headers`: 一级 tab 页 header 家族需要更新为更现代的轻品牌 header 语言,与详情页 back-header 形成更鲜明区分。

## Impact

- `miniapp/src/pages/index/*` 与首页相关组件 (`PrimaryTabs`、`SecondaryTabs`、`FilterBar`、`BidCard`、`InfoCard`)
- 小程序全局视觉 token、header / bottom-nav 组件
- 首页视觉验收截图、OpenSpec 首页相关长期 specs 与联调文档
