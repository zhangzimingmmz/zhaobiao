## 1. Scope And Dependency Audit

- [x] 1.1 Inventory the `ui/` directory contents and confirm which pages, routes, build files, and dependencies belong exclusively to the sample app
- [x] 1.2 Search the repository for references to `ui`, `/admin/reviews`, `/admin/companies`, and `/admin/crawl` to identify documents or scripts that assume `ui` is a formal system
- [x] 1.3 Verify that existing `server` admin APIs and crawler control capabilities can remain in place without the `ui` sample frontend

## 2. Remove The Sample App

- [x] 2.1 Delete the `ui/` directory and its sample frontend code as a single retired artifact
- [x] 2.2 Remove any root-level or local workflow references that still expect `ui` to be built, run, or treated as an active project
- [x] 2.3 Verify the repository no longer contains bundled `ui` routes, pages, or build artifacts

## 3. Update System Boundary Documentation

- [x] 3.1 Update architecture and requirements documents so formal system scope only includes `crawler`, `server`, and `miniapp`
- [x] 3.2 Remove or rewrite any text that describes `ui` as the current Web management backend
- [x] 3.3 Add explicit wording where needed that `ui` was a sample app and that future formal Web admin work requires a separate proposal

## 4. Validate Post-Retirement State

- [x] 4.1 Re-scan the repository for stale `ui` references and confirm only intentional historical references remain
- [x] 4.2 Verify OpenSpec artifacts, docs, and codebase structure are consistent about the retired `ui` boundary
- [x] 4.3 Summarize the retirement outcome and any follow-up gaps, especially the absence of a formal Web admin frontend
