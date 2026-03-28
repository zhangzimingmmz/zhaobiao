## Why

上一轮 `miniapp-visual-parity-polish` 已经把小程序从重渐变和厚卡片的默认 UI 拉回到更克制的白蓝体系，但最新截图说明视觉问题并没有真正收口。当前偏差不再是单个控件“大小不对”，而是页面版式本身仍然错误：频道页出现重复头部层级和大块无效留白，首页与收藏页在长屏设备上内容重心漂浮，登录页和列表页的纵向节奏也仍然偏松，导致整体观感和 PDF 目标继续拉开距离。

## What Changes

- 将工程建设、政府采购、信息公开三类频道页重排为“单一头部 + 单一页面标题 + 紧贴筛选区 + 立即进入列表”的结构，移除重复标题层和会制造大块空白的过渡层。
- 为收藏页建立独立的列表页版式，而不是继续沿用“标题下直接贴大胶囊 tab + 大白卡列表”的拼接方式。
- 重新平衡首页入口页的首屏密度，收紧品牌区和入口卡，并补充一个低权重的支撑区块，避免长屏设备下半屏出现大面积空白。
- 继续压缩登录页的标题区、表单卡和预览区总高度，把 form-first 节奏进一步向 PDF 靠拢。
- 建立第二轮视觉验收标准，明确排查重复头部、长屏空白、松散列表节奏和缺少独立页面版式的问题。

## Capabilities

### New Capabilities
- `miniapp-list-page-density-family`: 定义频道页与收藏页共享的高密度列表页家族，包括单一头部、标题与工具条的垂直节奏、列表区起始位置以及长屏空白控制规则。
- `miniapp-home-entry-support-band`: 定义首页入口页在三张频道入口卡之外的低权重支撑区块和长屏平衡规则，避免首页仅靠三张卡片导致页面下半部空置。

### Modified Capabilities
- `miniapp-page-family-headers`: 头部家族要求需要进一步禁止重复页面标题、蓝色整条频道顶栏和无语义的过渡层。
- `miniapp-primary-navigation-shell`: 一级 tab 页壳层需要继续收紧首屏重心，并为首页与收藏页提供更稳定的内容起始节奏。
- `miniapp-auth-page-family`: 登录页仍需保持表单优先，但要进一步压缩页面总高度，减少首屏下方的空白。
- `miniapp-home-card-presentation`: 入口卡、列表卡与收藏卡的尺寸、间距、动作权重和底部信息位置需要继续收紧。
- `miniapp-favorites-tab-page`: 收藏页的 tab 布局、标题区与卡片列表之间的版式关系需要从通用组件拼接改为专门页面结构。

## Impact

- 小程序页面：`miniapp/src/pages/index/*`、`miniapp/src/pages/construction/*`、`miniapp/src/pages/government/*`、`miniapp/src/pages/information/*`、`miniapp/src/pages/favorites/*`、`miniapp/src/pages/login/*`
- 公共组件与样式：`TopBar`、`SecondaryTabs`、`FilterBar`、`BidCard`、`InfoCard`、全局 page shell 与列表页样式
- 验收方式：需要重新截取首页、收藏页、频道页、登录页的模拟器或真机截图，逐项核对是否仍存在重复头部、首屏空白过大或页面没有独立版式的问题
