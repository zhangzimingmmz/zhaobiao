# 招投标平台 - 一键部署与常用命令
# 用法：make <target>  或  make help

.PHONY: deploy deploy-remote dev-api dev-admin help

help:
	@echo "部署命令："
	@echo "  make deploy            一键部署：自动识别 admin-frontend / 后端 / miniapp 变更并选择部署方式"
	@echo "  make deploy-remote     仅远程部署（默认 full），可追加 MODE=admin-frontend-static"
	@echo "  可覆盖：DEPLOY_HOST= DEPLOY_PATH= DEPLOY_SKIP_COMMIT=1 DEPLOY_SKIP_MINIAPP=1 DEPLOY_MODE="
	@echo ""
	@echo "开发命令："
	@echo "  make dev-api           本地仅启动 API"
	@echo "  make dev-admin         本地仅启动运营后台"

# 一键部署：commit + push + 小程序编译 + 按变更类型自动选择远程部署
# 自定义提交信息：make deploy MSG="fix: 修复登录"
deploy:
	./scripts/deploy.sh "$(MSG)"

# 仅远程部署（不提交、不编译）
deploy-remote:
	./scripts/deploy-remote.sh $(or $(DEPLOY_HOST),100.64.0.5) $(or $(DEPLOY_PATH),/opt/zhaobiao) $(or $(MODE),full)

# 本地开发：仅启动 API（需先安装依赖）
dev-api:
	PYTHONPATH=. uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

# 本地开发：仅启动运营后台（需先 cd admin-frontend && npm install）
dev-admin:
	cd admin-frontend && npm run dev
