# admin-frontend

极简运营后台前端工程。

## 本地开发

```bash
cd admin-frontend
npm install
npm run dev
```

默认开发地址：

- [http://127.0.0.1:5174](http://127.0.0.1:5174)

如需连接本地后端，可确保 `server` 运行在：

- `http://127.0.0.1:8000`

如需覆盖 API 地址，可设置：

```bash
VITE_API_BASE=http://127.0.0.1:8000 npm run dev
```
