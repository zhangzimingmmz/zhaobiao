## 1. Crawl observability foundation

- [ ] 1.1 Define lightweight crawl run snapshot persistence for `site`、`taskName`、`runKind`、`triggerSource`、timing、counts、summary、payload.
- [ ] 1.2 Update supported site1/site2 task entry points or wrappers so routine / maintenance / diagnostic runs all write normalized start/success/failure snapshots.
- [ ] 1.3 Define task catalog and freshness rules so overview can distinguish routine pipelines from maintenance/diagnostic tasks.

## 2. Admin crawl monitoring APIs and surfaces

- [ ] 2.1 Implement read-only admin APIs for pipeline overview, freshness signals, and run history queries.
- [ ] 2.2 Introduce a dedicated `/admin/crawl/*` admin layout / navigation inside the existing `ui/` workspace.
- [ ] 2.3 Build `/admin/crawl` overview and run history surfaces, clearly separating routine pipelines from maintenance/diagnostic runs.

## 3. Verification and follow-ups

- [ ] 3.1 Document the run snapshot schema, task catalog, and the meaning of execution-vs-data health signals.
- [ ] 3.2 Verify overview and history outputs against current logs, `notices` data, and site2 runbook expectations.
- [ ] 3.3 Record manual trigger / control-plane work as a follow-up change instead of implementing it here.
