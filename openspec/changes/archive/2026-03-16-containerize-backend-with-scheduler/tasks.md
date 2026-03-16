## 1. 镜像与运行时准备

- [x] 1.1 盘点并补齐统一镜像所需的 Python 依赖，确保 `server` 与 `crawler`（含 `site2` 的 `curl_cffi`）都能在容器内运行
- [x] 1.2 新增后端统一镜像的 Dockerfile 与必要启动脚本，支持整仓库运行而不是只打包 `server/`
- [x] 1.3 为 scheduler 选择并接入容器友好的定时执行方式（如 supercronic），准备定时计划配置与调用脚本

## 2. Compose 编排与调度接线

- [x] 2.1 新增 `docker-compose` 部署文件，定义 `api`、`scheduler`、`data`/`logs` 持久卷与必需环境变量
- [x] 2.2 将 scheduler 配置为通过管理 API 提交 `site1/site2` 的 `incremental` 与 `recovery` 任务，而不是直接执行 CLI
- [x] 2.3 固化 API 单实例运行约束、健康检查策略和持久化路径，避免多 worker / 多副本误用

## 3. 运维文档与部署验证

- [x] 3.1 编写完整部署文档，说明架构拓扑、环境变量、卷目录、例行调度策略与高风险手工任务边界
- [x] 3.2 补充迁移/回滚说明，覆盖新环境部署、容器重建后数据保留和手工 backfill 运维入口
- [x] 3.3 在目标环境或等效环境验证 Compose 启动、scheduler 提交 run request、`crawl_runs` 可观测，以及数据/日志卷可持续保留
