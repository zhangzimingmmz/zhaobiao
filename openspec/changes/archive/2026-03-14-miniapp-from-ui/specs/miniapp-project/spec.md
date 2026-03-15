# miniapp-project 规格

## ADDED Requirements

### Requirement: 项目位于 miniapp 目录且可构建为微信小程序

小程序源码与构建产出 MUST 位于仓库根下的 `miniapp/` 目录。使用 Taro（React）初始化项目，配置编译目标为微信小程序，产出目录（如 `dist`）MUST 包含微信小程序所需的 `app.js`、`app.json`、`project.config.json` 及页面与资源，以便微信开发者工具导入。

#### Scenario: 本地构建产出可被微信开发者工具打开

- **WHEN** 在 `miniapp/` 下执行构建命令（如 `npm run build:weapp` 或 `pnpm build:weapp`）
- **THEN** 在配置的 outputRoot（如 `dist`）下生成完整小程序包，且该目录在微信开发者工具中「导入项目」后能正常打开并预览

#### Scenario: 开发态可连续编译

- **WHEN** 在 `miniapp/` 下执行开发命令（如 `npm run dev:weapp`）
- **THEN** 监听源码变更并持续输出到产出目录，便于在微信开发者工具中实时预览

### Requirement: 项目配置与脚本明确

`miniapp/` 下 MUST 提供 `package.json`，包含依赖与脚本；MUST 包含 Taro 配置文件（如 `config/index.ts`），指定编译类型为微信小程序及 outputRoot。README 或文档 MUST 说明如何安装依赖、执行构建/开发、以及用微信开发者工具打开哪个目录。

#### Scenario: 新克隆仓库后能一键安装并构建

- **WHEN** 用户在 `miniapp/` 下执行依赖安装（如 `npm install` 或 `pnpm install`）后执行构建脚本
- **THEN** 无需修改配置即可得到可导入微信开发者工具的小程序产出目录

#### Scenario: 文档说明打开步骤

- **WHEN** 用户阅读 `miniapp/` 下的说明（如 README）
- **THEN** 能明确得知应使用微信开发者工具「导入项目」并选择产出目录（如 `miniapp/dist`）
