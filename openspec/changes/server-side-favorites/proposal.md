## Why

当前收藏完全保存在小程序本地存储中,既不能按账号同步,也无法利用服务端鉴权与数据状态控制。项目尚未正式上线,因此可以直接把收藏能力切换为登录用户的服务端持久化模型,避免未来再做本地收藏迁移。

## What Changes

- 新增面向登录用户的收藏后端能力,为招投标公告与信息展示文章提供收藏关系存储、切换与列表查询。
- **BREAKING** 小程序收藏不再依赖本地设备存储作为主数据源,未登录用户不允许收藏。
- 收藏页改为实时读取服务端收藏列表; 当源公告或文章不存在时,对应收藏项不再展示。
- 详情页与列表页收藏动作改为基于登录态调用服务端接口,并以服务端返回结果更新心形状态。

## Capabilities

### New Capabilities

- `favorites-api`: 登录用户的收藏关系存储、切换、查询与失效数据过滤能力。

### Modified Capabilities

- `miniapp-favorites-storage-model`: 将收藏数据源从本地共享记录模型改为服务端持久化模型,本地仅保留必要的轻量 UI 状态。
- `miniapp-favorites-tab-page`: 更新收藏页的 guest / empty / data-loading 行为,使其以登录态和服务端列表为中心。
- `miniapp-notice-detail-pages`: 更新详情页收藏动作,要求未登录用户不能收藏,已登录用户通过服务端接口切换收藏状态。

## Impact

- 后端数据库 schema 与 `server/main.py` 用户端 API
- 小程序首页、详情页、收藏页的收藏交互与数据流
- 收藏相关文档、OpenSpec 主 spec 与鉴权约束
