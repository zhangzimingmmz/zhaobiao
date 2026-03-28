## Why

当前运营后台的企业审核与企业管理高度重复，但管理员身份仍是单一固定账号，导致“谁审核的”无法形成真实审计，测试数据也缺少受控清理路径。需要同时补齐后台审核员身份体系和企业模块信息架构，避免继续在重复页面上叠加临时按钮。

## What Changes

- 新增后台审核员身份能力，支持 1 个超级管理员和 2 个审核员账号，并让审核动作写入真实审核人信息。
- 将企业审核队列与企业目录收敛为一个“企业管理”模块，在同一模块内区分申请视图与企业档案视图。
- 明确动作边界：审核员负责通过/驳回，超级管理员额外拥有测试数据删除、企业档案编辑、申请作废等高风险动作。
- 在列表与详情中展示审核人、审核时间等审计信息，使审核留痕可见、可核对。

## Capabilities

### New Capabilities

- `admin-reviewer-identity`: 定义后台多管理员账号、角色边界、登录身份和审核人留痕规则。

### Modified Capabilities

- `admin-enterprise-operations`: 将企业审核队列与企业目录收敛为统一模块，并按申请视图/企业档案视图区分操作与展示。

## Impact

- Affected code: `server/main.py`, `admin-frontend/src/lib/auth.ts`, `admin-frontend/src/pages/ReviewsPage.tsx`, `admin-frontend/src/pages/CompaniesPage.tsx`, `admin-frontend/src/pages/ReviewDetailPage.tsx`, `admin-frontend/src/pages/CompanyDetailPage.tsx`, shared enterprise table/detail components
- Affected APIs: `/api/admin/login`, `/api/admin/reviews*`, `/api/admin/companies*`, 新增或扩展管理员身份与企业管理相关接口
- Affected systems: 后台管理员登录、企业审核留痕、企业测试数据治理、企业模块导航与信息架构
