# 金堂招讯通 - 微信小程序

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

- **开发模式**（watch 模式，改代码自动重编译，产出到 `dist`）：
  ```bash
  npm run dev:weapp
  ```
  保持此命令运行，修改源码后会自动编译；微信开发者工具中开启「修改时自动保存」或「编译时自动保存」，可形成热加载体验。
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

- **API Base URL**：默认走 `src/config.ts` 中的本地开发地址 `http://localhost:8000`。生产-like 构建请通过 Taro 环境变量 `TARO_APP_API_BASE` 注入，例如 `https://api-zhaobiao.zhangziming.cn`。
- **生产-like 构建示例**：
  ```bash
  TARO_APP_API_BASE=https://api-zhaobiao.zhangziming.cn npm run build:weapp
  ```
- **微信 request 合法域名**：真机预览或线上发布前，需在微信小程序后台把 `https://api-zhaobiao.zhangziming.cn` 加入 request 合法域名白名单。
- **本地/真机调试**：开发时执行 `npm run dev:weapp`，用微信开发者工具打开 `miniapp/dist` 目录；真机预览时在开发者工具中点击「预览」生成二维码，扫码即可。若请求跨域或域名未备案，需在小程序后台配置 request 合法域名。
