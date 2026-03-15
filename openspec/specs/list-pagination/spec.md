### Requirement: 首页列表支持分页加载更多
首页列表 SHALL 维护 `page` 状态，初始值为 1；列表底部展示「加载更多」按钮，点击后 page+1 并将新数据追加到列表末尾；当返回数据条数小于 pageSize 时判定为最后一页，隐藏「加载更多」按钮。

#### Scenario: 初次加载
- **WHEN** 页面首次渲染或 category/筛选参数变化
- **THEN** page 重置为 1，列表清空，重新请求第一页数据

#### Scenario: 点击加载更多
- **WHEN** 用户点击「加载更多」按钮
- **THEN** page+1，追加下一页数据到列表末尾，按钮显示 loading 状态

#### Scenario: 已到最后一页
- **WHEN** 返回的 `data.list` 长度小于 `pageSize`（或 `total <= page * pageSize`）
- **THEN** 「加载更多」按钮替换为「已全部加载」提示文字

#### Scenario: 加载更多时出现错误
- **WHEN** 加载更多的网络请求失败
- **THEN** 已有列表数据保持不变，显示 Toast 提示「加载失败，请重试」，按钮恢复可点击状态

### Requirement: 移除 Mock 数据 fallback
首页列表请求失败时 SHALL 展示空状态组件（`EmptyState`）而非 Mock 数据，避免掩盖真实网络或数据问题。

#### Scenario: 接口返回错误或网络异常
- **WHEN** `api.list()` 的 promise reject 或返回 code !== 200
- **THEN** 显示 EmptyState 组件，文案「加载失败，请检查网络或服务状态」
- **THEN** 不展示任何 Mock 数据
