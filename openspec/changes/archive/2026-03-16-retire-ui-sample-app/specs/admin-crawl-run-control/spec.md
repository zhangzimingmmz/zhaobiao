## REMOVED Requirements

### Requirement: 后台 SHALL 展示手工请求的受理状态与拒绝原因
**Reason**: 当前仓库中的 `/admin/crawl` 页面属于 `ui` 样例工程的一部分，随着 `ui` 整体退役，不再保留该前端展示要求。
**Migration**: 服务端继续保留手工采集请求和运行状态查询接口；若未来需要正式控制台前端，应在新的正式后台工程中重新声明状态展示与交互 requirement。
