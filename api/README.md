# API 精确真相

本目录为「接口精确真相」的约定位置。

- **当前实现**：后端由 FastAPI 提供，**运行时**可通过 `GET /openapi.json` 获取 OpenAPI 3 文档（本地默认 `http://localhost:8000/openapi.json`）；Swagger UI 为 `http://localhost:8000/docs`。
- **离线 YAML**：若需版本库中保留一份 `openapi.yaml`，可在服务启动后执行导出，例如：
  ```bash
  curl -s http://localhost:8000/openapi.json | python3 -c "import sys,json,yaml; print(yaml.dump(json.load(sys.stdin), allow_unicode=True))" > api/openapi.yaml
  ```
  或使用其他 OpenAPI 导出工具。未导出时，以运行时的 `/openapi.json` 为准。
- **谁改**：接口变更由改接口的人同步更新；若维护 `openapi.yaml`，应与代码同 PR。
- **Review**：必须；接口与契约变更需重点 review。
