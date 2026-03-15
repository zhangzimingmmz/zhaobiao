# 招投标信息平台 - 微信小程序

基于 Taro 3 + React 的微信小程序端，是当前仓库内唯一的正式用户前端。接口规范见 **`docs/接口文档-前端与小程序.md`**。

## 环境要求

- Node >= 16.20.0
- 微信开发者工具（用于预览与上传）

## 安装依赖

```bash
cd miniapp
npm install
# 或 pnpm install
```

## 开发与构建

- **开发模式**（监听文件变更，产出到 `dist`）：
  ```bash
  npm run dev:weapp
  ```
- **生产构建**：
  ```bash
  npm run build:weapp
  ```

## 用微信开发者工具打开

1. 打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 选择「导入项目」。
3. 目录选择本仓库下的 **`miniapp/dist`**（需先执行一次 `npm run dev:weapp` 或 `npm run build:weapp` 生成）。
4. 若项目根目录没有 `project.config.json`，可复制 `miniapp/project.config.json` 到 `miniapp/dist/` 后再导入。
5. 建议在开发者工具中：关闭「上传代码时样式自动补全」、关闭「ES6 转 ES5」、关闭「代码压缩上传」，避免与 Taro 编译产物冲突。

## 环境变量与配置

- **API Base URL**：在 `src/config.ts` 中修改 `config.baseUrl`，或通过 Taro 环境变量 `TARO_APP_API_BASE` 注入（需在 `config/index.ts` 的 `defineConstants` 中配置 `process.env.TARO_APP_API_BASE`）。未配置时默认为 `https://api.example.com`，列表/详情在无后端时可使用 Mock 数据。
- **本地/真机调试**：开发时执行 `npm run dev:weapp`，用微信开发者工具打开 `miniapp/dist` 目录；真机预览时在开发者工具中点击「预览」生成二维码，扫码即可。若请求跨域或域名未备案，需在小程序后台配置 request 合法域名。
