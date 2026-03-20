# Admin Frontend

统一运营后台前端工程，位于仓库内 `admin-frontend/`。

## Stack

- React 18
- Vite 5
- TypeScript
- Ant Design 5
- Ant Design Pro Components

## Local Development

在项目根目录的 `admin-frontend/` 下运行：

```bash
npm install
npm run dev
```

默认通过 `VITE_API_BASE` 连接后端；未提供时使用 `http://127.0.0.1:8000`。

## Scope

当前第一阶段覆盖：

- 总览
- 企业审核
- 企业目录
- 公司详情占位页
- 采集控制
- 运行记录
- 运行详情
- 内容管理

受保护路由通过本地管理员会话进入；未登录访问会重定向到 `/login`。
